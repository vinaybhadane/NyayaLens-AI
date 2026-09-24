import { TimelineEvent } from '../schemas/document.ts';
import { RawClause } from '../segmentation/clauseSplitter.ts';

/**
 * Absolute date pattern:
 * - Day Month, Year (1st day of October, 2026 / 15th day of November, 2026)
 * - Month Day, Year (August 31, 2027 / October 1, 2026)
 * - ISO dates (YYYY-MM-DD)
 * - Slash/dash dates (DD/MM/YYYY, DD-MM-YYYY)
 */
const ABSOLUTE_DATE_REGEX =
  /\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s]+\d{4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?[,\s]+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{4})\b/gi;

/**
 * Relative legal timeline pattern:
 * - "within 30 days after"
 * - "at least 60 days prior to"
 * - "payable on or before the 5th day"
 * - "lock-in period of 6 months"
 * - "period of 12 months"
 */
const RELATIVE_DEADLINE_REGEX =
  /\b(?:within|prior to|after|before|at least|notice period of|lock-in period of|period of|payable on or before the)\s+(?:\d+|one|two|three|thirty|sixty|ninety)(?:st|nd|rd|th)?\s+(?:day\s+of\s+[a-z\s]+|calendar\s+|business\s+)?(?:days?|weeks?|months?|years?)(?:\s+(?:after|of|prior to|before|following)\s+[a-z\s]+)?/gi;

/**
 * Deterministically extracts timeline events and deadlines from document clauses.
 *
 * @param clauses - Segmented document clauses
 * @returns Array of TimelineEvents
 */
export function extractDeadlinesAndDates(clauses: RawClause[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let eventCounter = 1;

  for (const clause of clauses) {
    const text = clause.text;

    // 1. Extract absolute dates
    ABSOLUTE_DATE_REGEX.lastIndex = 0;
    let absMatch: RegExpExecArray | null;
    while ((absMatch = ABSOLUTE_DATE_REGEX.exec(text)) !== null) {
      const matchText = absMatch[0];
      const category = categorizeTimelineEvent(text, absMatch.index);
      events.push({
        id: `event-${eventCounter++}`,
        dateOrPeriod: matchText,
        description: getContextSnippet(text, absMatch.index, matchText.length),
        clauseId: clause.id,
        type: category,
      });
    }

    // 2. Extract relative deadlines
    RELATIVE_DEADLINE_REGEX.lastIndex = 0;
    let relMatch: RegExpExecArray | null;
    while ((relMatch = RELATIVE_DEADLINE_REGEX.exec(text)) !== null) {
      const matchText = relMatch[0];
      const category = categorizeTimelineEvent(text, relMatch.index);
      events.push({
        id: `event-${eventCounter++}`,
        dateOrPeriod: matchText,
        description: getContextSnippet(text, relMatch.index, matchText.length),
        clauseId: clause.id,
        type: category,
      });
    }
  }

  return events;
}

/**
 * Categorizes a timeline event based on neighboring keywords.
 */
function categorizeTimelineEvent(
  text: string,
  matchIndex: number
): TimelineEvent['type'] {
  const windowStart = Math.max(0, matchIndex - 60);
  const windowEnd = Math.min(text.length, matchIndex + 80);
  const context = text.slice(windowStart, windowEnd).toLowerCase();

  if (context.includes('cure') || context.includes('due') || context.includes('complet')) return 'deadline';
  if (context.includes('pay') || context.includes('rent') || context.includes('fee')) return 'payment';
  if (context.includes('notice') || context.includes('notify')) return 'notice';
  if (context.includes('renew') || context.includes('extend')) return 'renewal';
  if (context.includes('commence') || context.includes('effective')) return 'effective';
  if (context.includes('terminat') || context.includes('expire')) return 'deadline';
  return 'other';
}

/**
 * Extracts a concise surrounding sentence snippet for readability.
 */
function getContextSnippet(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 60);
  let snippet = text.slice(start, end).replace(/\n/g, ' ').trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}
