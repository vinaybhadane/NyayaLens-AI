/**
 * Patterns indicating a user is asking for legal advice, litigation predictions, or legal verdicts.
 */
const ADVICE_INTENT_PATTERNS = [
  /\bshould\s+i\s+(?:sue|take\s+to\s+court|file\s+a\s+case|stop\s+paying|break|terminate)\b/i,
  /\bwill\s+i\s+(?:win|lose|get\s+sued|be\s+arrested)\b/i,
  /\bcan\s+i\s+(?:sue|get\s+away\s+with|refuse\s+to\s+pay|withhold\s+rent)\b/i,
  /\bis\s+.*?\b(?:illegal|against\s+the\s+law|a\s+crime|fraud|enforceable|valid)\b/i,
  /\bwhat\s+(?:are\s+my\s+odds|is\s+my\s+legal\s+defense|is\s+the\s+best\s+legal\s+strategy)\b/i,
  /\btell\s+me\s+if\s+i\s+can\s+break\s+this\s+contract\b/i,
];

/**
 * Result of checking query against legal boundary guard.
 */
export interface BoundaryCheckResult {
  isAdviceSeeking: boolean;
  detectedPattern?: string;
  boundaryNotice?: string;
  recommendedEscalation: string;
}

/**
 * Detects whether a user prompt is asking for legal advice instead of document understanding.
 *
 * @param query - User's question or search prompt
 * @returns BoundaryCheckResult
 */
export function detectAdviceSeeking(query: string): BoundaryCheckResult {
  const trimmed = query.trim();

  for (const pattern of ADVICE_INTENT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isAdviceSeeking: true,
        detectedPattern: pattern.source,
        boundaryNotice:
          'Legal Boundary Notice: NyayaLens provides document information and plain-language assistance, not legal advice or outcome predictions. For decisions on litigation, breach, or legal liability, please consult a licensed advocate.',
        recommendedEscalation:
          'We recommend preparing a Lawyer Prep Brief and scheduling a consultation with an advocate or local Legal Aid cell (DLSA/NALSA).',
      };
    }
  }

  return {
    isAdviceSeeking: false,
    recommendedEscalation: '',
  };
}

/**
 * Checks for prompt injection attempts within document or query text.
 *
 * @param text - Text content to inspect
 * @returns True if text contains prompt injection signatures
 */
export function hasPromptInjectionSignatures(text: string): boolean {
  const injectionPatterns = [
    /ignore\s+(?:all\s+)?previous\s+instructions/i,
    /disregard\s+(?:all\s+)?prior\s+(?:prompts|rules)/i,
    /you\s+are\s+now\s+(?:a|an)\s+[a-z\s]+(?:mode|dan|unfiltered)/i,
    /system\s*:\s*you\s+must/i,
    /<\|im_start\|>/i,
  ];

  return injectionPatterns.some((p) => p.test(text));
}
