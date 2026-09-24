import { describe, it, expect } from 'vitest';
import { splitIntoClauses } from '@/lib/segmentation/clauseSplitter.ts';
import { chunkClauses } from '@/lib/segmentation/chunker.ts';
import { normalizeText } from '@/lib/parsing/normalizer.ts';
import { verifyFileMagicBytes } from '@/lib/parsing/magicBytes.ts';
import { SAMPLE_RENTAL_AGREEMENT, SAMPLE_EMPLOYMENT_CONTRACT } from '@/test/fixtures/agreements.ts';

describe('Parameter 1 & 4 — Segmentation & Parsing Unit Tests (12 tests)', () => {
  // 1. Numbered clauses
  it('1. correctly segments documents with numbered clauses (1., 2.)', () => {
    const clauses = splitIntoClauses(SAMPLE_RENTAL_AGREEMENT);
    expect(clauses.length).toBeGreaterThanOrEqual(6);
    expect(clauses[0]?.title).toContain('Term of Lease');
    expect(clauses[1]?.title).toContain('Rent and Payment');
  });

  // 2. Heading-based clauses
  it('2. correctly segments documents with Clause/Article headers', () => {
    const clauses = splitIntoClauses(SAMPLE_EMPLOYMENT_CONTRACT);
    expect(clauses.length).toBeGreaterThanOrEqual(4);
    expect(clauses[0]?.title).toContain('Position and Commencement');
    expect(clauses[2]?.title).toContain('Non-Compete');
  });

  // 3. Lettered clauses
  it('3. segments lettered clauses like (a), (b), (c)', () => {
    const text = `
    (a) The Tenant shall maintain the property in good sanitary condition.
    (b) The Landlord may inspect the premises with 24 hours prior notice.
    (c) No sub-letting is permitted without explicit consent.
    `;
    const clauses = splitIntoClauses(text);
    expect(clauses.length).toBe(3);
  });

  // 4. Fallback paragraph splitting
  it('4. uses fallback paragraph split when formal numbering is missing', () => {
    const rawParagraphs = `
    This is an unformatted introductory paragraph describing general context of the commercial transaction between parties.
    
    This is a second separate paragraph detailing standard operating procedures and liability disclaimers for equipment handling.
    
    This is a third distinct paragraph discussing payment schedules and invoice reconciliation at the end of each billing cycle.
    `;
    const clauses = splitIntoClauses(rawParagraphs);
    expect(clauses.length).toBe(3);
    expect(clauses[0]?.id).toBe('clause-1');
  });

  // 5. Empty and single-line document handling
  it('5. handles empty and single-line documents gracefully without crashing', () => {
    expect(splitIntoClauses('')).toEqual([]);
    const single = splitIntoClauses('Just one simple sentence.');
    expect(single.length).toBe(1);
    expect(single[0]?.text).toBe('Just one simple sentence.');
  });

  // 6. Chunking never splits an individual clause
  it('6. guarantees chunking never splits an individual clause across chunks', () => {
    const clauses = splitIntoClauses(SAMPLE_RENTAL_AGREEMENT);
    const chunks = chunkClauses(clauses, { maxCharactersPerChunk: 300, clauseOverlapCount: 0 });

    for (const chunk of chunks) {
      for (const clause of chunk.clauses) {
        expect(chunk.combinedText).toContain(clause.text);
      }
    }
  });

  // 7. Chunking respects character thresholds
  it('7. produces multiple chunks when document exceeds character limit', () => {
    const clauses = splitIntoClauses(SAMPLE_RENTAL_AGREEMENT);
    const chunks = chunkClauses(clauses, { maxCharactersPerChunk: 400 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  // 8. Chunking overlap behaves correctly
  it('8. retains specified overlap count between adjacent chunks', () => {
    const clauses = splitIntoClauses(SAMPLE_RENTAL_AGREEMENT);
    const chunks = chunkClauses(clauses, { maxCharactersPerChunk: 400, clauseOverlapCount: 1 });
    if (chunks.length > 1 && chunks[0] && chunks[1]) {
      const lastOfFirst = chunks[0].clauses[chunks[0].clauses.length - 1];
      const firstOfSecond = chunks[1].clauses[0];
      expect(lastOfFirst?.id).toBe(firstOfSecond?.id);
    }
  });

  // 9. Text normalization handles Unicode NFKC and whitespace
  it('9. normalizes full-width Unicode characters and extraneous whitespace', () => {
    const fullWidth = 'Ｔｅｒｍ　ｏｆ　Ｌｅａｓｅ\r\n\r\n\r\n\r\nMultiple   spaces   here.';
    const normalized = normalizeText(fullWidth);
    expect(normalized).toBe('Term of Lease\n\nMultiple spaces here.');
  });

  // 10. Magic bytes recognizes valid PDF header
  it('10. verifies PDF file header by magic bytes (%PDF)', () => {
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const res = verifyFileMagicBytes(pdfHeader, 'contract.pdf');
    expect(res.isValid).toBe(true);
    expect(res.type).toBe('pdf');
  });

  // 11. Magic bytes recognizes DOCX header (PK\x03\x04)
  it('11. verifies DOCX file header by magic bytes (PK\\x03\\x04)', () => {
    const docxHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    const res = verifyFileMagicBytes(docxHeader, 'agreement.docx');
    expect(res.isValid).toBe(true);
    expect(res.type).toBe('docx');
  });

  // 12. Rejects spoofed extension with executable/unknown bytes
  it('12. rejects spoofed file extensions with unknown magic bytes', () => {
    const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ header
    const res = verifyFileMagicBytes(exeBytes, 'malicious.pdf');
    expect(res.isValid).toBe(false);
    expect(res.type).toBe('unknown');
  });
});
