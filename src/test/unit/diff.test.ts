import { describe, it, expect } from 'vitest';
import { alignAndDiffClauses, calculateTokenSimilarity } from '@/lib/diff/textDiff.ts';
import { splitIntoClauses } from '@/lib/segmentation/clauseSplitter.ts';
import { SAMPLE_RENTAL_AGREEMENT, REVISED_RENTAL_AGREEMENT } from '@/test/fixtures/agreements.ts';

describe('Parameter 1, 3 & 6 — Compare & Diff Logic Unit Tests (6 tests)', () => {
  // 1. Token similarity: identical strings
  it('1. calculates 1.0 similarity for identical strings', () => {
    const text = 'The monthly rent shall be INR 25,000 payable on the 5th.';
    expect(calculateTokenSimilarity(text, text)).toBe(1.0);
  });

  // 2. Token similarity: partial overlap
  it('2. calculates proportional similarity for modified clauses', () => {
    const textA = 'The monthly rent shall be INR 25,000 payable on the 5th.';
    const textB = 'The monthly rent shall be INR 28,000 payable on the 1st.';
    const sim = calculateTokenSimilarity(textA, textB);
    expect(sim).toBeGreaterThan(0.5);
    expect(sim).toBeLessThan(1.0);
  });

  // 3. Diff alignment identifies unchanged clauses
  it('3. identifies unchanged clauses between original and revised document', () => {
    const leftClauses = splitIntoClauses(SAMPLE_RENTAL_AGREEMENT);
    const rightClauses = splitIntoClauses(REVISED_RENTAL_AGREEMENT);

    const changes = alignAndDiffClauses(leftClauses, rightClauses);
    const unchanged = changes.find((c) => c.kind === 'unchanged');
    expect(unchanged).toBeDefined();
    expect(unchanged?.materiality).toBe('minor');
  });

  // 4. Diff alignment identifies modified clauses (rent increased)
  it('4. identifies modified terms (e.g., rent and security deposit changes)', () => {
    const leftClauses = splitIntoClauses(SAMPLE_RENTAL_AGREEMENT);
    const rightClauses = splitIntoClauses(REVISED_RENTAL_AGREEMENT);

    const changes = alignAndDiffClauses(leftClauses, rightClauses);
    const modified = changes.filter((c) => c.kind === 'modified');
    expect(modified.length).toBeGreaterThanOrEqual(1);
  });

  // 5. Diff alignment detects newly added clauses
  it('5. identifies added clauses (e.g., Non-Compete / Commercial activity restriction)', () => {
    const leftClauses = splitIntoClauses(SAMPLE_RENTAL_AGREEMENT);
    const rightClauses = splitIntoClauses(REVISED_RENTAL_AGREEMENT);

    const changes = alignAndDiffClauses(leftClauses, rightClauses);
    const added = changes.find((c) => c.kind === 'added');
    expect(added).toBeDefined();
    expect(added?.rightTitle).toContain('Non-Compete');
  });

  // 6. Diff alignment detects removed clauses
  it('6. identifies removed clauses when a clause is omitted in the revised version', () => {
    const leftClauses = splitIntoClauses(SAMPLE_RENTAL_AGREEMENT);
    // Remove arbitration clause from right
    const rightClauses = splitIntoClauses(SAMPLE_RENTAL_AGREEMENT).slice(0, 4);

    const changes = alignAndDiffClauses(leftClauses, rightClauses);
    const removed = changes.filter((c) => c.kind === 'removed');
    expect(removed.length).toBeGreaterThanOrEqual(1);
  });
});
