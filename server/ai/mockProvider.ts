import { RawClause } from '../../src/lib/segmentation/clauseSplitter.ts';
import { ClauseAnalysis } from '../../src/lib/schemas/clause.ts';
import { QaAnswer } from '../../src/lib/schemas/qa.ts';
import { LawyerBrief } from '../../src/lib/schemas/brief.ts';
import { CompareResult } from '../../src/lib/schemas/compare.ts';
import { detectAdviceSeeking } from '../../src/lib/boundary/adviceDetector.ts';

/**
 * Deterministic offline AI provider for testing and offline fallback.
 * Generates schema-compliant outputs grounded in actual input texts.
 */
export class MockAiProvider {
  /**
   * Analyzes segmented clauses and produces deterministic structured analyses.
   */
  public async analyzeClauses(
    clauses: RawClause[],
    _lang = 'en'
  ): Promise<ClauseAnalysis[]> {
    return clauses.map((clause, idx) => {
      const lower = clause.text.toLowerCase();
      const type = inferClauseType(lower);
      const isHighRisk =
        lower.includes('indemnif') ||
        lower.includes('non-compete') ||
        lower.includes('sole discretion') ||
        lower.includes('unilateral');
      const isMedRisk =
        lower.includes('lock-in') ||
        lower.includes('penalty') ||
        lower.includes('auto-renew') ||
        lower.includes('arbitration');

      const risk = isHighRisk ? 'high' : isMedRisk ? 'medium' : 'low';
      const riskReason = isHighRisk
        ? 'High risk: May expose the signing party to unlimited indemnity or one-sided obligations.'
        : isMedRisk
        ? 'Medium risk: Requires attention regarding timelines, penalties, or termination constraints.'
        : 'Low risk: Standard mutual provisions typical for this agreement.';

      const quote = clause.text.slice(0, Math.min(60, clause.text.length));

      return {
        id: clause.id || `clause-${idx + 1}`,
        type,
        title: clause.title || `Clause ${idx + 1}`,
        original: clause.text,
        plain: {
          en: `In simple terms: ${clause.title}. This clause outlines obligations regarding ${type.replace('_', ' ')}.`,
          hi: `सरल शब्दों में: यह धारा ${type} से संबंधित शर्तों और जिम्मेदारियों को स्पष्ट करती है।`,
          mr: `सोप्या भाषेत: हे कलम ${type} विषयीच्या अटी व जबाबदाऱ्या स्पष्ट करते.`,
        },
        risk,
        riskReason,
        obligations: [
          {
            party: lower.includes('tenant') ? 'Tenant' : lower.includes('employee') ? 'Employee' : 'Signing Party',
            action: `Comply with terms in ${clause.title}`,
          },
        ],
        options: [
          {
            category: 'clarify',
            title: 'Request clarification',
            description: 'Ask for specific written definitions for ambiguous phrasing.',
            sampleWording: `Could you clarify the exact scope of ${clause.title}?`,
          },
        ],
        spans: [
          {
            clauseId: clause.id,
            start: 0,
            end: quote.length,
            quote,
          },
        ],
        verified: true,
      };
    });
  }

  /**
   * Generates grounded Q&A response with abstention on ungrounded queries.
   */
  public async answerQuestion(
    question: string,
    documentText: string,
    clauses: RawClause[] = []
  ): Promise<QaAnswer> {
    const boundaryCheck = detectAdviceSeeking(question);
    const qLower = question.toLowerCase();

    // Check if question keywords exist in document
    const docLower = documentText.toLowerCase();
    const queryTokens = qLower.replace(/[^\w\s]/g, '').split(/\s+/).filter((w) => w.length > 3);
    const matchingTokens = queryTokens.filter((token) => docLower.includes(token));

    const isAnswerable = matchingTokens.length > 0;

    if (!isAnswerable) {
      return {
        answerable: false,
        answer:
          'This document does not appear to address that question. To prevent hallucination, NyayaLens abstains from speculating.',
        citations: [],
        confidence: 'low',
        suggestedQuestions: [
          'What happens in circumstances not covered by this agreement?',
          'Is there an addendum or supplementary policy governing this topic?',
          'Which party bears the liability if an unspecified event occurs?',
        ],
        boundaryNotice: boundaryCheck.boundaryNotice,
      };
    }

    // Find clause with highest token overlap
    let bestClause = clauses[0];
    let maxOverlap = 0;
    for (const c of clauses) {
      const cLower = c.text.toLowerCase();
      const count = queryTokens.filter((t) => cLower.includes(t)).length;
      if (count > maxOverlap) {
        maxOverlap = count;
        bestClause = c;
      }
    }

    const matchedQuote = bestClause
      ? bestClause.text.slice(0, Math.min(80, bestClause.text.length))
      : documentText.slice(0, 80);

    return {
      answerable: true,
      answer: `Based on the provided document, ${bestClause ? bestClause.title : 'the agreement'} addresses this issue. Please review the highlighted clause for specific obligations.`,
      citations: [
        {
          clauseId: bestClause ? bestClause.id : 'clause-1',
          start: 0,
          end: matchedQuote.length,
          quote: matchedQuote,
        },
      ],
      confidence: 'high',
      suggestedQuestions: [
        'How does this clause interact with termination conditions?',
        'Can this clause be amended or waived by mutual consent?',
      ],
      boundaryNotice: boundaryCheck.boundaryNotice,
    };
  }

  /**
   * Generates a Lawyer Prep Brief.
   */
  public async generateBrief(
    documentTitle: string,
    _documentText: string,
    clauses: RawClause[] = []
  ): Promise<LawyerBrief> {
    return {
      documentTitle,
      preparedDate: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      keyParties: ['First Party / Landlord / Employer', 'Second Party / Tenant / Employee'],
      corePurpose: `Comprehensive legal review of ${documentTitle} to identify potential liabilities and negotiate balanced terms.`,
      criticalDeadlines: [
        'Notice period requirement prior to renewal or termination',
        'Payment due within 5 business days of notice',
      ],
      highRiskClauses: clauses
        .filter((c) => c.text.toLowerCase().includes('indemnif') || c.text.toLowerCase().includes('liability'))
        .slice(0, 3)
        .map((c) => ({
          clauseId: c.id,
          title: c.title,
          concern: 'Potentially one-sided indemnification or liability caps.',
          spans: [{ clauseId: c.id, start: 0, end: Math.min(50, c.text.length), quote: c.text.slice(0, 50) }],
        })),
      ambiguitiesOrMissingTerms: [
        'Force majeure clause lacks specific dispute resolution timelines',
        'No grace period specified for delayed payments or cure of default',
      ],
      prioritizedQuestions: [
        {
          id: 'q-1',
          priority: 'high',
          topic: 'Indemnity & Liability',
          question: 'Is the indemnity clause mutually binding or strictly unilateral against me?',
          contextFromDoc: 'Section addressing indemnification and damages.',
          suggestedGoal: 'Cap liability to the total contract value or fees paid.',
        },
        {
          id: 'q-2',
          priority: 'medium',
          topic: 'Termination Notice',
          question: 'Can the counterparty terminate without cause, and what notice period is required?',
          contextFromDoc: 'Section addressing termination and lock-in.',
          suggestedGoal: 'Ensure equal reciprocal notice periods of at least 30 days.',
        },
      ],
      legalAidInfo: {
        organization: 'National Legal Services Authority (NALSA) & DLSA',
        helpline: '15100',
        website: 'https://nalsa.gov.in',
        eligibilityNote: 'Statutory free legal aid available under Section 12 of the Legal Services Authorities Act, 1987.',
      },
    };
  }

  /**
   * Generates document comparison results.
   */
  public async compareDocuments(
    _leftText: string,
    _rightText: string,
    alignedChanges: CompareResult['changes']
  ): Promise<CompareResult> {
    return {
      changes: alignedChanges,
      inconsistencies: [
        {
          description: 'Notice period in Termination clause differs from the notice period in the Summary preamble.',
          spans: [],
        },
      ],
      summary: `Document comparison identified ${alignedChanges.filter((c) => c.kind !== 'unchanged').length} substantive changes between versions.`,
    };
  }
}

function inferClauseType(text: string): ClauseAnalysis['type'] {
  if (text.includes('rent') || text.includes('fee') || text.includes('payment') || text.includes('compensation')) return 'payment';
  if (text.includes('term') || text.includes('duration') || text.includes('period')) return 'term';
  if (text.includes('terminat') || text.includes('cancel')) return 'termination';
  if (text.includes('renew') || text.includes('exten')) return 'renewal';
  if (text.includes('liab') || text.includes('damage')) return 'liability';
  if (text.includes('indemn')) return 'indemnity';
  if (text.includes('confidential') || text.includes('non-disclosure')) return 'confidentiality';
  if (text.includes('intellectual property') || text.includes('patent') || text.includes('copyright')) return 'ip';
  if (text.includes('non-compete') || text.includes('restrictive')) return 'non_compete';
  if (text.includes('arbitrat') || text.includes('dispute')) return 'dispute_resolution';
  if (text.includes('jurisdiction') || text.includes('governing law')) return 'jurisdiction';
  return 'other';
}
