import { RawClause } from '../segmentation/clauseSplitter.ts';
import { CompareChange } from '../schemas/compare.ts';

/**
 * Aligns two sets of clauses using structural position, title match, and token similarity.
 *
 * @param leftClauses - Clauses from original document
 * @param rightClauses - Clauses from revised document
 * @returns Array of aligned CompareChanges
 */
export function alignAndDiffClauses(
  leftClauses: RawClause[],
  rightClauses: RawClause[]
): CompareChange[] {
  const changes: CompareChange[] = [];
  const matchedRightIndices = new Set<number>();

  // Compare each left clause against right clauses
  for (const left of leftClauses) {
    let bestScore = 0;
    let bestRightIdx = -1;

    for (let r = 0; r < rightClauses.length; r++) {
      if (matchedRightIndices.has(r)) continue;
      const right = rightClauses[r];
      if (!right) continue;

      const textSim = calculateTokenSimilarity(left.text, right.text);
      const titleSim = calculateTokenSimilarity(left.title, right.title);
      // Combined alignment score giving weight to title match
      const totalScore = titleSim >= 0.5 ? Math.max(textSim, (titleSim * 0.6) + (textSim * 0.4)) : textSim;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestRightIdx = r;
      }
    }

    if (bestRightIdx !== -1 && bestScore >= 0.85) {
      // Unchanged or minor edit
      matchedRightIndices.add(bestRightIdx);
      const right = rightClauses[bestRightIdx]!;
      const isIdentical = bestScore >= 0.98;

      changes.push({
        kind: isIdentical ? 'unchanged' : 'modified',
        leftClauseId: left.id,
        rightClauseId: right.id,
        leftTitle: left.title,
        rightTitle: right.title,
        leftText: left.text,
        rightText: right.text,
        materiality: isIdentical ? 'minor' : 'moderate',
        explanation: isIdentical
          ? 'Clause wording is identical across both versions.'
          : 'Minor phrasing or wording differences detected without major structural change.',
        spans: [
          { clauseId: left.id, start: left.startIndex, end: left.endIndex, quote: left.text.slice(0, 100) },
          { clauseId: right.id, start: right.startIndex, end: right.endIndex, quote: right.text.slice(0, 100) },
        ],
      });
    } else if (bestRightIdx !== -1 && bestScore >= 0.25) {
      // Substantially modified clause
      matchedRightIndices.add(bestRightIdx);
      const right = rightClauses[bestRightIdx]!;

      changes.push({
        kind: 'modified',
        leftClauseId: left.id,
        rightClauseId: right.id,
        leftTitle: left.title,
        rightTitle: right.title,
        leftText: left.text,
        rightText: right.text,
        materiality: 'major',
        explanation: `Clause terms materially altered (${Math.round((1 - bestScore) * 100)}% text divergence).`,
        spans: [
          { clauseId: left.id, start: left.startIndex, end: left.endIndex, quote: left.text.slice(0, 100) },
          { clauseId: right.id, start: right.startIndex, end: right.endIndex, quote: right.text.slice(0, 100) },
        ],
      });
    } else {
      // Removed in revised document
      changes.push({
        kind: 'removed',
        leftClauseId: left.id,
        leftTitle: left.title,
        leftText: left.text,
        materiality: 'major',
        explanation: 'Clause present in original document was removed in the revised document.',
        spans: [{ clauseId: left.id, start: left.startIndex, end: left.endIndex, quote: left.text.slice(0, 100) }],
      });
    }
  }

  // Any remaining unmatched right clauses are added
  for (let r = 0; r < rightClauses.length; r++) {
    if (!matchedRightIndices.has(r)) {
      const right = rightClauses[r]!;
      changes.push({
        kind: 'added',
        rightClauseId: right.id,
        rightTitle: right.title,
        rightText: right.text,
        materiality: 'major',
        explanation: 'New clause introduced in the revised document.',
        spans: [{ clauseId: right.id, start: right.startIndex, end: right.endIndex, quote: right.text.slice(0, 100) }],
      });
    }
  }

  return changes;
}

/**
 * Calculates Jaccard token similarity between two text snippets (0.0 to 1.0).
 */
export function calculateTokenSimilarity(textA: string, textB: string): number {
  if (textA === textB) return 1.0;
  if (!textA || !textB) return 0.0;

  const setA = new Set(tokenize(textA));
  const setB = new Set(tokenize(textB));

  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0.0 : intersection / union;
}

/**
 * Helper to tokenize string into words.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}
