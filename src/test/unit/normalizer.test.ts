import { describe, it, expect } from 'vitest';
import { normalizeText, maskPii, unmaskPii } from '@/lib/parsing/normalizer.ts';

describe('Parameter 1 & 4 — Normalizer and PII Masking Unit Tests', () => {
  it('normalizes CRLF, multiple newlines, horizontal tabs, and control characters', () => {
    const raw = "First line\r\nSecond line\x00\x08with control chars\t\t\n\n\n\nThird line   ";
    const normalized = normalizeText(raw);

    expect(normalized).not.toContain('\r');
    expect(normalized).not.toContain('\x00');
    expect(normalized).not.toContain('\n\n\n');
    expect(normalized).toContain('First line\nSecond line');
  });

  it('handles empty input gracefully', () => {
    expect(normalizeText('')).toBe('');
  });

  it('masks emails, phone numbers, and government identification numbers', () => {
    const sample = 'Contact tenant Rahul Sharma at rahul.sharma@example.com or +91 98765 43210. PAN: ABCDE1234F.';
    const { maskedText, replacements } = maskPii(sample);

    expect(maskedText).toContain('[EMAIL_1]');
    expect(maskedText).toContain('[PHONE_2]');
    expect(maskedText).toContain('[ID_3]');
    expect(maskedText).not.toContain('rahul.sharma@example.com');
    expect(maskedText).not.toContain('ABCDE1234F');

    // Unmasking check
    const restored = unmaskPii(maskedText, replacements);
    expect(restored).toBe(sample);
  });

  it('unmasks text cleanly even if no PII was detected', () => {
    const text = 'Standard agreement terms with no personal data.';
    const { maskedText, replacements } = maskPii(text);
    expect(maskedText).toBe(text);
    expect(unmaskPii(maskedText, replacements)).toBe(text);
  });
});
