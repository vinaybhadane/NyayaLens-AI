import { normalizeText } from '../parsing/normalizer.ts';

/**
 * Raw segmented clause block.
 */
export interface RawClause {
  id: string;
  title: string;
  text: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Regex matching legal clause numbering or headers at start of line:
 * - "1. Term of Lease", "1.1 Subclause", "1)"
 * - "Clause 1:", "Clause 1 -", "Article 2", "Section 3"
 * - "(a) Text", "(1) Text", "a. Text"
 */
const HEADER_PREFIX_REGEX =
  /^(?:(?:Article|Section|Clause)\s+[0-9IVXLCDM]+[.:\s-]?|(?:[0-9]+(?:\.[0-9]+)*[.:)]?|\([a-z0-9]+\)|[a-z][.:)]))\s+/i;

/**
 * Segments normalized document text into structured clauses.
 * Pure deterministic logic with zero network calls.
 *
 * @param text - Normalized document text
 * @returns Array of segmented RawClause objects
 */
export function splitIntoClauses(text: string): RawClause[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const lines = normalized.split('\n');
  const clauses: RawClause[] = [];

  let currentTitle = '';
  let currentLines: string[] = [];
  let clauseIndex = 1;
  let currentStartOffset = 0;
  let charOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const trimmed = rawLine.trim();

    if (!trimmed) {
      charOffset += rawLine.length + 1;
      continue;
    }

    const isHeader = isClauseHeader(trimmed);

    if (isHeader) {
      // If we already have accumulated text from a previous clause, save it
      if (currentLines.length > 0 && currentTitle) {
        const clauseText = currentLines.join('\n').trim();
        clauses.push({
          id: `clause-${clauseIndex++}`,
          title: currentTitle,
          text: clauseText,
          startIndex: currentStartOffset,
          endIndex: currentStartOffset + clauseText.length,
        });
        currentLines = [];
      }

      currentTitle = trimmed;
      currentStartOffset = charOffset;
      currentLines.push(trimmed);
    } else {
      if (!currentTitle) {
        currentTitle = trimmed;
        currentStartOffset = charOffset;
      }
      currentLines.push(trimmed);
    }

    charOffset += rawLine.length + 1;
  }

  // Push remaining clause
  if (currentLines.length > 0 && currentTitle) {
    const clauseText = currentLines.join('\n').trim();
    clauses.push({
      id: `clause-${clauseIndex}`,
      title: currentTitle,
      text: clauseText,
      startIndex: currentStartOffset,
      endIndex: currentStartOffset + clauseText.length,
    });
  }

  // If preamble was captured as clause-1 and clause-2 is the real first clause
  if (
    clauses.length > 1 &&
    clauses[0] &&
    !isClauseHeader(clauses[0].title) &&
    clauses[0].text.length < 120
  ) {
    // Remove preamble title line so clause-1 is the first actual legal clause
    clauses.shift();
    // Re-index remaining clauses
    clauses.forEach((c, idx) => {
      c.id = `clause-${idx + 1}`;
    });
  }

  // Fallback: If no headers matched at all, split by paragraphs
  if (clauses.length <= 1 && /\n\s*\n/.test(normalized)) {
    const fallback = fallbackParagraphSplit(normalized);
    if (fallback.length > 1) {
      return fallback;
    }
  }

  return clauses;
}

/**
 * Checks whether a line starts with a legal clause identifier.
 */
function isClauseHeader(line: string): boolean {
  if (line.length === 0 || line.length > 150) return false;
  return HEADER_PREFIX_REGEX.test(line);
}

/**
 * Fallback segmenter splitting by double paragraphs when formal legal numbering is missing.
 */
function fallbackParagraphSplit(text: string): RawClause[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  let offset = 0;

  return paragraphs.map((para, idx) => {
    const trimmed = para.trim();
    const start = text.indexOf(trimmed, offset);
    const end = start >= 0 ? start + trimmed.length : trimmed.length;
    offset = end;

    const firstLine = trimmed.split('\n')[0] || '';
    const titleSnippet = firstLine.slice(0, 50).trim();
    const title = titleSnippet ? `Clause ${idx + 1}: ${titleSnippet}` : `Clause ${idx + 1}`;

    return {
      id: `clause-${idx + 1}`,
      title,
      text: trimmed,
      startIndex: start >= 0 ? start : 0,
      endIndex: end,
    };
  });
}
