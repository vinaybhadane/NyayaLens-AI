import { SourceSpan } from '../schemas/common.ts';
import { normalizeText } from '../parsing/normalizer.ts';

/**
 * Result of grounding verification for a single span.
 */
export interface SpanVerificationResult {
  span: SourceSpan;
  isValid: boolean;
  matchType: 'exact' | 'normalized' | 'none';
  computedStart?: number;
  computedEnd?: number;
}

/**
 * Result of document/answer level grounding verification.
 */
export interface GroundingReport {
  isGrounded: boolean;
  groundedRatio: number;
  verifiedSpans: SourceSpan[];
  unverifiedSpans: SourceSpan[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Verifies whether an AI-cited quote exists in the source document.
 * Supports exact matching and normalized whitespace/punctuation matching.
 *
 * @param quote - The quote claimed by the AI
 * @param sourceText - The full source text or clause text
 * @returns Verification result with computed positions
 */
export function verifyQuoteInSource(
  quote: string,
  sourceText: string
): { isValid: boolean; matchType: 'exact' | 'normalized' | 'none'; start: number; end: number } {
  if (!quote || !sourceText) {
    return { isValid: false, matchType: 'none', start: -1, end: -1 };
  }

  const cleanQuote = quote.trim();
  if (cleanQuote.length < 5) {
    return { isValid: false, matchType: 'none', start: -1, end: -1 };
  }

  // 1. Direct exact match
  const exactIndex = sourceText.indexOf(cleanQuote);
  if (exactIndex !== -1) {
    return {
      isValid: true,
      matchType: 'exact',
      start: exactIndex,
      end: exactIndex + cleanQuote.length,
    };
  }

  // 2. Normalized whitespace match
  const normSource = normalizeText(sourceText);
  const normQuote = normalizeText(cleanQuote);

  const normIndex = normSource.indexOf(normQuote);
  if (normIndex !== -1) {
    return {
      isValid: true,
      matchType: 'normalized',
      start: normIndex,
      end: normIndex + normQuote.length,
    };
  }

  // 3. Fallback: Substring window match (first 80% of quote)
  if (cleanQuote.length > 30) {
    const subQuote = cleanQuote.slice(0, Math.floor(cleanQuote.length * 0.8)).trim();
    const subIndex = sourceText.indexOf(subQuote);
    if (subIndex !== -1) {
      return {
        isValid: true,
        matchType: 'normalized',
        start: subIndex,
        end: subIndex + subQuote.length,
      };
    }
  }

  return { isValid: false, matchType: 'none', start: -1, end: -1 };
}

/**
 * Verifies a collection of source citations against the source document.
 * Drops or tags hallucinated quotes and evaluates groundedness confidence.
 *
 * @param spans - Citations extracted or returned by model
 * @param sourceText - Complete source document text
 * @returns Grounding report with verified spans and confidence
 */
export function verifyAllCitations(
  spans: SourceSpan[] | undefined | null,
  sourceText: string
): GroundingReport {
  if (!spans || !Array.isArray(spans) || spans.length === 0) {
    return {
      isGrounded: false,
      groundedRatio: 0,
      verifiedSpans: [],
      unverifiedSpans: [],
      confidence: 'low',
    };
  }

  const verifiedSpans: SourceSpan[] = [];
  const unverifiedSpans: SourceSpan[] = [];

  for (const span of spans) {
    const res = verifyQuoteInSource(span.quote, sourceText);
    if (res.isValid) {
      verifiedSpans.push({
        ...span,
        start: res.start >= 0 ? res.start : span.start,
        end: res.end >= 0 ? res.end : span.end,
      });
    } else {
      unverifiedSpans.push(span);
    }
  }

  const groundedRatio = verifiedSpans.length / spans.length;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (groundedRatio >= 0.9 && verifiedSpans.length > 0) {
    confidence = 'high';
  } else if (groundedRatio >= 0.5) {
    confidence = 'medium';
  }

  return {
    isGrounded: verifiedSpans.length > 0,
    groundedRatio,
    verifiedSpans,
    unverifiedSpans,
    confidence,
  };
}
