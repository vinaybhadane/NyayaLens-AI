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
        newAnalyses = await this.callGeminiForClauses(gemini, missingClauses, lang);
      } catch (err) {
        console.warn('[AiOrchestrator] Gemini failed, falling back to mock provider:', err);
        newAnalyses = await mockProvider.analyzeClauses(missingClauses, lang);
      }
    } else {
      newAnalyses = await mockProvider.analyzeClauses(missingClauses, lang);
    }

    if (!Array.isArray(newAnalyses) || newAnalyses.length === 0) {
      newAnalyses = await mockProvider.analyzeClauses(missingClauses, lang);
    }

    // 3. Grounding Verification and Cache Storage
    for (const analysis of newAnalyses) {
      const grounding = verifyAllCitations(analysis.spans, analysis.original);
      analysis.verified = grounding.isGrounded;

      const cacheKey = analysisCache.generateKey(analysis.original, 'analyze', PROMPT_VERSION, lang);
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

function parseClauseAnalyses(rawText: string): ClauseAnalysis[] {
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned);
  if (Array.isArray(parsed)) return parsed as ClauseAnalysis[];
  if (parsed && Array.isArray((parsed as Record<string, unknown>).clauses)) {
    return (parsed as { clauses: ClauseAnalysis[] }).clauses;
  }
  if (parsed && typeof parsed === 'object') {
    return Object.values(parsed) as ClauseAnalysis[];
  }
  throw new Error('Gemini response could not be parsed into ClauseAnalysis array');
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
    return parseClauseAnalyses(response.response.text());
  } catch (primaryErr) {
    console.warn(`[AiOrchestrator] Model ${primaryModel} failed, trying gemini-1.5-flash fallback:`, primaryErr);
    const fallback = gemini.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: GLOBAL_SYSTEM_INSTRUCTION,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const response = await fallback.generateContent(prompt);
    return parseClauseAnalyses(response.response.text());
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
    console.warn(`[AiOrchestrator] Model ${primaryModel} failed for QA, trying gemini-1.5-flash fallback:`, primaryErr);
    const fallback = gemini.getGenerativeModel({
      model: 'gemini-1.5-flash',
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
