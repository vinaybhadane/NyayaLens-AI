import { RawClause } from './clauseSplitter.ts';

/**
 * Structured clause chunk with metadata.
 */
export interface ClauseChunk {
  chunkIndex: number;
  clauses: RawClause[];
  combinedText: string;
  startClauseId: string;
  endClauseId: string;
}

/**
 * Options for adaptive chunking.
 */
export interface ChunkOptions {
  maxCharactersPerChunk?: number;
  clauseOverlapCount?: number;
}

const DEFAULT_MAX_CHARS = 4000;
const DEFAULT_OVERLAP = 1;

/**
 * Groups clauses into adaptive chunks without ever splitting an individual clause.
 * Preserves clause integrity and guarantees bounded size per chunk.
 *
 * @param clauses - Array of segmented RawClause objects
 * @param options - Chunk sizing and overlap configuration
 * @returns Array of grouped ClauseChunks
 */
export function chunkClauses(
  clauses: RawClause[],
  options: ChunkOptions = {}
): ClauseChunk[] {
  if (clauses.length === 0) return [];

  const maxChars = options.maxCharactersPerChunk ?? DEFAULT_MAX_CHARS;
  const overlap = Math.max(0, options.clauseOverlapCount ?? DEFAULT_OVERLAP);

  const chunks: ClauseChunk[] = [];
  let currentGroup: RawClause[] = [];
  let currentLength = 0;
  let chunkIndex = 0;

  for (let i = 0; i < clauses.length; i++) {
    const clause = clauses[i];
    if (!clause) continue;

    const clauseLen = clause.text.length + clause.title.length + 10;

    // If adding this clause exceeds maxChars and currentGroup isn't empty, create chunk
    if (currentLength + clauseLen > maxChars && currentGroup.length > 0) {
      chunks.push(buildChunk(chunkIndex++, currentGroup));

      // Overlap: retain last `overlap` clauses for context continuity
      const nextGroup = currentGroup.slice(-overlap);
      currentGroup = [...nextGroup, clause];
      currentLength = currentGroup.reduce(
        (sum, c) => sum + c.text.length + c.title.length + 10,
        0
      );
    } else {
      currentGroup.push(clause);
      currentLength += clauseLen;
    }
  }

  // Push final chunk
  if (currentGroup.length > 0) {
    chunks.push(buildChunk(chunkIndex, currentGroup));
  }

  return chunks;
}

/**
 * Helper to build ClauseChunk object.
 */
function buildChunk(chunkIndex: number, clauses: RawClause[]): ClauseChunk {
  const combinedText = clauses
    .map((c) => `### ${c.title} [ID: ${c.id}]\n${c.text}`)
    .join('\n\n');

  const firstClause = clauses[0];
  const lastClause = clauses[clauses.length - 1];

  return {
    chunkIndex,
    clauses,
    combinedText,
    startClauseId: firstClause ? firstClause.id : '',
    endClauseId: lastClause ? lastClause.id : '',
  };
}
