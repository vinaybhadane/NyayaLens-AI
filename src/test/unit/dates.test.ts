import { describe, it, expect } from 'vitest';
import { extractDeadlinesAndDates } from '@/lib/dates/dateExtractor.ts';
import { splitIntoClauses } from '@/lib/segmentation/clauseSplitter.ts';
import { SAMPLE_RENTAL_AGREEMENT, SAMPLE_EMPLOYMENT_CONTRACT } from '@/test/fixtures/agreements.ts';

describe('Parameter 1, 3 & 4 — Deterministic Legal Logic & Dates (12 tests)', () => {
  const rentalClauses = splitIntoClauses(SAMPLE_RENTAL_AGREEMENT);
  const employmentClauses = splitIntoClauses(SAMPLE_EMPLOYMENT_CONTRACT);

  // 1. Formal written dates
  it('1. extracts formal written dates (e.g., 1st day of October, 2026)', () => {
    const events = extractDeadlinesAndDates(rentalClauses);
    const dateMatch = events.find((e) => e.dateOrPeriod.includes('October, 2026'));
    expect(dateMatch).toBeDefined();
  });

  // 2. Standard calendar dates
  it('2. extracts calendar end dates (e.g., August 31, 2027)', () => {
    const events = extractDeadlinesAndDates(rentalClauses);
    const dateMatch = events.find((e) => e.dateOrPeriod.includes('August 31, 2027'));
    expect(dateMatch).toBeDefined();
  });

  // 3. Employment commencement dates
  it('3. extracts commencement dates from employment agreements', () => {
    const events = extractDeadlinesAndDates(employmentClauses);
    const commMatch = events.find((e) => e.dateOrPeriod.includes('November, 2026'));
    expect(commMatch).toBeDefined();
  });

  // 4. Relative deadline: within 30 days
  it('4. extracts relative deadlines like "within 30 days after"', () => {
    const events = extractDeadlinesAndDates(rentalClauses);
    const relMatch = events.find((e) => e.dateOrPeriod.toLowerCase().includes('within 30 days'));
    expect(relMatch).toBeDefined();
  });

  // 5. Notice periods: notice period of 60 days
  it('5. extracts relative notice period requirements', () => {
    const events = extractDeadlinesAndDates(employmentClauses);
    const noticeMatch = events.find((e) => e.dateOrPeriod.toLowerCase().includes('60 days'));
    expect(noticeMatch).toBeDefined();
  });

  // 6. Payment recurring dates: payable on the 5th
  it('6. extracts recurring payment schedules', () => {
    const text = 'Rent is payable on or before the 5th day of each calendar month.';
    const clauses = splitIntoClauses(text);
    const events = extractDeadlinesAndDates(clauses);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events.some((e) => e.type === 'payment')).toBe(true);
  });

  // 7. Lock-in periods
  it('7. extracts lock-in and commitment durations', () => {
    const text = 'Both parties agree to a lock-in period of 6 months.';
    const clauses = splitIntoClauses(text);
    const events = extractDeadlinesAndDates(clauses);
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  // 8. Multi-date clauses
  it('8. extracts multiple timeline events present in a single clause', () => {
    const text = 'Term begins on October 1, 2026 and ends on August 31, 2027 with renewal notice within 30 days.';
    const clauses = splitIntoClauses(text);
    const events = extractDeadlinesAndDates(clauses);
    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  // 9. Categorization: notice events
  it('9. categorizes events with notice keywords as "notice"', () => {
    const text = 'Tenant must give written notice period of 30 days prior to vacating.';
    const clauses = splitIntoClauses(text);
    const events = extractDeadlinesAndDates(clauses);
    expect(events[0]?.type).toBe('notice');
  });

  // 10. Categorization: deadline events
  it('10. categorizes expiration or termination limits as "deadline"', () => {
    const text = 'Cure period must be completed within 15 days of default notice.';
    const clauses = splitIntoClauses(text);
    const events = extractDeadlinesAndDates(clauses);
    expect(events[0]?.type).toBe('deadline');
  });

  // 11. Context snippet extraction
  it('11. provides surrounding contextual snippet for the event', () => {
    const events = extractDeadlinesAndDates(rentalClauses);
    expect(events[0]?.description.length).toBeGreaterThan(10);
    expect(events[0]?.clauseId).toBeDefined();
  });

  // 12. Gracefully handles text without dates
  it('12. returns an empty list for text with no dates or deadlines', () => {
    const text = 'The parties acknowledge mutual respect and confidential treatment of ideas.';
    const clauses = splitIntoClauses(text);
    const events = extractDeadlinesAndDates(clauses);
    expect(events).toEqual([]);
  });
});
