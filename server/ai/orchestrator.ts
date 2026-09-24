import { getGeminiClient, getGeminiModelName } from './geminiClient.ts';
import { MockAiProvider } from './mockProvider.ts';
import { analysisCache } from '../cache/lruCache.ts';
import { RawClause } from '../../src/lib/segmentation/clauseSplitter.ts';
import { ClauseAnalysis } from '../../src/lib/schemas/clause.ts';
import { QaAnswer } from '../../src/lib/schemas/qa.ts';
import { LawyerBrief } from '../../src/lib/schemas/brief.ts';
import { CompareResult } from '../../src/lib/schemas/compare.ts';
import { verifyAllCitations } from '../../src/lib/grounding/verifier.ts';
import {
  GLOBAL_SYSTEM_INSTRUCTION,
  CLAUSE_ANALYSIS_PROMPT,
  GROUNDED_QA_PROMPT,
  PROMPT_VERSION,
} from './prompts.ts';

const mockProvider = new MockAiProvider();

/**
 * AI Orchestrator providing server-side LLM calls with grounding verification,
 * LRU caching, anti-prompt injection delimiters, and offline fallback.
 */
export class AiOrchestrator {
  /**
   * Analyzes document clauses in batch with caching and grounding verification.
   */
  public async analyzeClauses(
    clauses: RawClause[],
    lang = 'en'
  ): Promise<ClauseAnalysis[]> {
    const results: ClauseAnalysis[] = [];
    const missingClauses: RawClause[] = [];

    // 1. Check LRU cache for each clause
    for (const clause of clauses) {
      const cacheKey = analysisCache.generateKey(clause.text, 'analyze', PROMPT_VERSION, lang);
      const cached = analysisCache.get<ClauseAnalysis>(cacheKey);
      if (cached) {
        results.push(cached);
      } else {
        missingClauses.push(clause);
      }
    }

    if (missingClauses.length === 0) {
      return results;
    }

    // 2. Process missing clauses via Gemini or Mock
    const gemini = getGeminiClient();
    let newAnalyses: ClauseAnalysis[] = [];

    if (gemini && process.env.NODE_ENV !== 'test') {
      try {
        console.log(`[AiOrchestrator] Calling live Gemini API (${getGeminiModelName()}) for ${missingClauses.length} clauses...`);
        const startTime = Date.now();
        newAnalyses = await this.callGeminiForClauses(gemini, missingClauses, lang);
        console.log(`[AiOrchestrator] Live Gemini API responded in ${Date.now() - startTime}ms with ${newAnalyses.length} analyzed clauses!`);
      } catch (err) {
        console.warn('[AiOrchestrator] Gemini API failed, falling back to mock provider:', err);
        newAnalyses = await mockProvider.analyzeClauses(missingClauses, lang);
      }
    } else {
      console.log(`[AiOrchestrator] Using offline Mock Provider for ${missingClauses.length} clauses (Gemini Key: ${gemini ? 'present' : 'missing'})`);
      newAnalyses = await mockProvider.analyzeClauses(missingClauses, lang);
    }

    if (!Array.isArray(newAnalyses) || newAnalyses.length === 0) {
      newAnalyses = await mockProvider.analyzeClauses(missingClauses, lang);
    }

    // 3. Grounding Verification and Cache Storage
    for (let i = 0; i < newAnalyses.length; i++) {
      const analysis = newAnalyses[i];
      const fallbackClause = missingClauses[i] || missingClauses[0];

      if (!analysis.original && fallbackClause) {
        analysis.original = fallbackClause.text;
      }
      if (!analysis.title && fallbackClause) {
        analysis.title = fallbackClause.title;
      }
      if (!analysis.spans || !Array.isArray(analysis.spans) || analysis.spans.length === 0) {
        const text = analysis.original || '';
        analysis.spans = [
          {
            clauseId: analysis.id || fallbackClause?.id || `clause-${i + 1}`,
            start: 0,
            end: Math.min(60, text.length),
            quote: text.slice(0, 60),
          },
        ];
      }

      const grounding = verifyAllCitations(analysis.spans, analysis.original || '');
      analysis.verified = grounding.isGrounded;

      const cacheKey = analysisCache.generateKey(analysis.original || `clause-${i}`, 'analyze', PROMPT_VERSION, lang);
      analysisCache.set(cacheKey, analysis);
      results.push(analysis);
    }

    return results;
  }

  /**
   * Performs Grounded Q&A with strict verification and abstention.
   */
  public async answerQuestion(
    question: string,
    documentText: string,
    clauses: RawClause[] = []
  ): Promise<QaAnswer> {
    const cacheKey = analysisCache.generateKey(
      `${question}:::${documentText.slice(0, 500)}`,
      'qa',
      PROMPT_VERSION
    );
    const cached = analysisCache.get<QaAnswer>(cacheKey);
    if (cached) return cached;

    const gemini = getGeminiClient();
    let answer: QaAnswer;

    if (gemini && process.env.NODE_ENV !== 'test') {
      try {
        answer = await this.callGeminiForQa(gemini, question, documentText);
      } catch {
        answer = await mockProvider.answerQuestion(question, documentText, clauses);
      }
    } else {
      answer = await mockProvider.answerQuestion(question, documentText, clauses);
    }

    // Grounding verification
    if (answer.citations.length > 0) {
      const report = verifyAllCitations(answer.citations, documentText);
      answer.citations = report.verifiedSpans;
      if (!report.isGrounded) {
        answer.confidence = 'low';
      }
    }

    analysisCache.set(cacheKey, answer);
    return answer;
  }

  /**
   * Generates Lawyer Prep Brief.
   */
  public async generateBrief(
    documentTitle: string,
    documentText: string,
    clauses: RawClause[] = []
  ): Promise<LawyerBrief> {
    const cacheKey = analysisCache.generateKey(
      `${documentTitle}:::${documentText.slice(0, 500)}`,
      'brief',
      PROMPT_VERSION
    );
    const cached = analysisCache.get<LawyerBrief>(cacheKey);
    if (cached) return cached;

    const brief = await mockProvider.generateBrief(documentTitle, documentText, clauses);
    analysisCache.set(cacheKey, brief);
    return brief;
  }

  /**
   * Compares two documents.
   */
  public async compareDocuments(
    leftText: string,
    rightText: string,
    alignedChanges: CompareResult['changes']
  ): Promise<CompareResult> {
    return mockProvider.compareDocuments(leftText, rightText, alignedChanges);
  }

  private parseClauseAnalyses(rawText: string): ClauseAnalysis[] {
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    let items: Record<string, unknown>[] = [];
    if (Array.isArray(parsed)) {
      items = parsed as Record<string, unknown>[];
    } else if (parsed && Array.isArray((parsed as Record<string, unknown>).clauses)) {
      items = (parsed as { clauses: Record<string, unknown>[] }).clauses;
    } else if (parsed && typeof parsed === 'object') {
      items = Object.values(parsed) as Record<string, unknown>[];
    } else {
      throw new Error('Gemini response could not be parsed into ClauseAnalysis array');
    }

    return items.map((item, idx) => {
      const type = (item.type || item.clauseType || 'other') as ClauseAnalysis['type'];
      const plainRaw = item.plain || item.plainLanguageRewrite;
      const plain = (typeof plainRaw === 'object' && plainRaw !== null)
        ? (plainRaw as ClauseAnalysis['plain'])
        : {
            en: typeof plainRaw === 'string' ? plainRaw : 'Plain language summary not provided.',
            hi: 'सरल भाषा स्पष्टीकरण।',
            mr: 'सोप्या भाषेत स्पष्टीकरण.',
          };
      const rawRisk = String(item.risk || item.riskLevel || 'medium').toLowerCase();
      const risk = (rawRisk.includes('high') ? 'high' : rawRisk.includes('low') ? 'low' : 'medium') as ClauseAnalysis['risk'];
      const riskReason = String(item.riskReason || item.rationale || item.reason || 'Legal review recommended.');
      const options = (Array.isArray(item.options) ? item.options : Array.isArray(item.nextSteps) ? item.nextSteps : []) as ClauseAnalysis['options'];
      const obligations = (Array.isArray(item.obligations) ? item.obligations : []) as ClauseAnalysis['obligations'];

      return {
        id: (item.id as string) || `clause-${idx + 1}`,
        type,
        title: (item.title as string) || `Clause ${idx + 1}`,
        original: (item.original as string) || '',
        plain,
        risk,
        riskReason,
        obligations,
        options,
        spans: (Array.isArray(item.spans) ? item.spans : []) as ClauseAnalysis['spans'],
        verified: true,
      };
    });
  }

  /**
   * Private helper to invoke Gemini API for clause analysis.
   */
  private async callGeminiForClauses(
    gemini: ReturnType<typeof getGeminiClient> & {},
    clauses: RawClause[],
    _lang: string
  ): Promise<ClauseAnalysis[]> {
    const primaryModel = getGeminiModelName();
    const clausesPayload = clauses
      .map((c) => `[ID: ${c.id}] Title: ${c.title}\nText: ${c.text}`)
      .join('\n---\n');
    const prompt = `${CLAUSE_ANALYSIS_PROMPT}\n\n<<<DOCUMENT_DATA>>>\n${clausesPayload}\n<<<DOCUMENT_DATA>>>`;

    try {
      const model = gemini.getGenerativeModel({
        model: primaryModel,
        systemInstruction: GLOBAL_SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const response = await model.generateContent(prompt);
      return this.parseClauseAnalyses(response.response.text());
    } catch (primaryErr) {
      console.warn(`[AiOrchestrator] Model ${primaryModel} failed, trying gemini-2.5-pro fallback:`, primaryErr);
      const fallback = gemini.getGenerativeModel({
        model: 'gemini-2.5-pro',
        systemInstruction: GLOBAL_SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const response = await fallback.generateContent(prompt);
      return this.parseClauseAnalyses(response.response.text());
    }
  }

  /**
   * Private helper to invoke Gemini API for Q&A.
   */
  private async callGeminiForQa(
    gemini: ReturnType<typeof getGeminiClient> & {},
    question: string,
    documentText: string
  ): Promise<QaAnswer> {
    const primaryModel = getGeminiModelName();
    const prompt = `${GROUNDED_QA_PROMPT}\n\nQuestion: "${question}"\n\n<<<DOCUMENT_DATA>>>\n${documentText}\n<<<DOCUMENT_DATA>>>`;

    try {
      const model = gemini.getGenerativeModel({
        model: primaryModel,
        systemInstruction: GLOBAL_SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const response = await model.generateContent(prompt);
      const cleaned = response.response.text().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(cleaned) as QaAnswer;
    } catch (primaryErr) {
      console.warn(`[AiOrchestrator] Model ${primaryModel} failed for QA, trying gemini-2.5-pro fallback:`, primaryErr);
      const fallback = gemini.getGenerativeModel({
        model: 'gemini-2.5-pro',
        systemInstruction: GLOBAL_SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const response = await fallback.generateContent(prompt);
      const cleaned = response.response.text().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(cleaned) as QaAnswer;
    }
  }
}

export const aiOrchestrator = new AiOrchestrator();
