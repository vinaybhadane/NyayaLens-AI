import { describe, it, expect } from 'vitest';
import { verifyQuoteInSource, verifyAllCitations } from '@/lib/grounding/verifier.ts';
import { detectAdviceSeeking, hasPromptInjectionSignatures } from '@/lib/boundary/adviceDetector.ts';
import { validateFramingTone } from '@/lib/boundary/disclaimers.ts';
import { SAMPLE_RENTAL_AGREEMENT, ADVERSARIAL_INJECTION_DOCUMENT } from '@/test/fixtures/agreements.ts';

describe('Parameter 2, 4 & 6 — Grounding Verifier & Legal Boundary (10 tests)', () => {
  const sampleSource = SAMPLE_RENTAL_AGREEMENT;

  // 1. Exact quote match
  it('1. verifier accepts exact quotes found in source text', () => {
    const exactQuote = 'monthly rent shall be INR 25,000';
    const result = verifyQuoteInSource(exactQuote, sampleSource);
    expect(result.isValid).toBe(true);
    expect(result.matchType).toBe('exact');
    expect(result.start).toBeGreaterThan(-1);
  });

  // 2. Whitespace-normalized match
  it('2. verifier accepts quotes with irregular whitespace or linebreaks', () => {
    const messyQuote = 'monthly   rent   shall   be   INR   25,000';
    const result = verifyQuoteInSource(messyQuote, sampleSource);
    expect(result.isValid).toBe(true);
    expect(result.matchType).toBe('normalized');
  });

  // 3. Hallucinated / fabricated quote rejection
  it('3. verifier strictly rejects fabricated quotes not in source', () => {
    const fabricatedQuote = 'Landlord shall provide free swimming pool access and gold bars';
    const result = verifyQuoteInSource(fabricatedQuote, sampleSource);
    expect(result.isValid).toBe(false);
    expect(result.matchType).toBe('none');
  });

  // 4. Batch citation verification and unverified citation flagging
  it('4. batch verifier separates verified from unverified citations', () => {
    const citations = [
      { clauseId: 'clause-2', start: 0, end: 10, quote: 'monthly rent shall be INR 25,000' },
      { clauseId: 'clause-99', start: 0, end: 10, quote: 'Tenant is granted 50% equity in property' },
    ];
    const report = verifyAllCitations(citations, sampleSource);
    expect(report.verifiedSpans.length).toBe(1);
    expect(report.unverifiedSpans.length).toBe(1);
    expect(report.confidence).toBe('medium');
  });

  // 5. Abstention rule triggers on empty or ungrounded citations
  it('5. abstention rules mark confidence as low when no citations exist', () => {
    const report = verifyAllCitations([], sampleSource);
    expect(report.isGrounded).toBe(false);
    expect(report.confidence).toBe('low');
  });

  // 6. Advice-seeking detector: "should I sue?"
  it('6. advice detector flags litigation intent ("should I sue")', () => {
    const query = 'My landlord didn’t return the deposit, should I sue him in court?';
    const res = detectAdviceSeeking(query);
    expect(res.isAdviceSeeking).toBe(true);
    expect(res.boundaryNotice).toContain('Legal Boundary Notice');
  });

  // 7. Advice-seeking detector: "will I win?"
  it('7. advice detector flags outcome prediction ("will I win?")', () => {
    const query = 'Will I win if I take this non-compete clause before a judge?';
    const res = detectAdviceSeeking(query);
    expect(res.isAdviceSeeking).toBe(true);
    expect(res.recommendedEscalation).toContain('Lawyer Prep Brief');
  });

  // 8. Advice-seeking detector: "is this illegal?"
  it('8. advice detector flags statutory conclusion query ("is this illegal")', () => {
    const query = 'Is this 11-month lock-in clause illegal under Indian contract law?';
    const res = detectAdviceSeeking(query);
    expect(res.isAdviceSeeking).toBe(true);
  });

  // 9. Framing tone validator enforces informational non-advice phrasing
  it('9. tone validator rejects advice imperatives like "you must sue"', () => {
    expect(validateFramingTone('You must sue your landlord immediately.')).toBe(false);
    expect(validateFramingTone('This clause says notice is required 30 days prior.')).toBe(true);
    expect(validateFramingTone('You may want to ask for clarification on the deposit terms.')).toBe(true);
  });

  // 10. Prompt injection detector identifies adversarial override attempts
  it('10. detects adversarial prompt injection commands in untrusted text', () => {
    const hasInjection = hasPromptInjectionSignatures(ADVERSARIAL_INJECTION_DOCUMENT);
    expect(hasInjection).toBe(true);

    const normalDoc = hasPromptInjectionSignatures(SAMPLE_RENTAL_AGREEMENT);
    expect(normalDoc).toBe(false);
  });
});
