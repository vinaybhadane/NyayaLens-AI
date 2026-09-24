import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '@server/index.ts';
import { SAMPLE_RENTAL_AGREEMENT, REVISED_RENTAL_AGREEMENT } from '@/test/fixtures/agreements.ts';
import { analysisCache } from '@server/cache/lruCache.ts';

describe('Parameter 2 & 4 — Integration & API Security Tests (14 tests)', () => {
  // 1. GET /api/health
  it('1. GET /api/health returns healthy status and cache statistics', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.cache).toBeDefined();
  });

  // 2. POST /api/analyze valid payload
  it('2. POST /api/analyze processes document and returns schema-conformant analysis', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({
        title: 'Rental Agreement Test',
        text: SAMPLE_RENTAL_AGREEMENT,
        targetLanguage: 'en',
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.clauses.length).toBeGreaterThanOrEqual(5);
    expect(res.body.data.riskSummary).toBeDefined();
    expect(res.body.data.timeline).toBeDefined();
  });

  // 3. POST /api/compare valid payload
  it('3. POST /api/compare aligns and compares two documents', async () => {
    const res = await request(app)
      .post('/api/compare')
      .send({
        leftTitle: 'Original Agreement',
        leftText: SAMPLE_RENTAL_AGREEMENT,
        rightTitle: 'Revised Agreement',
        rightText: REVISED_RENTAL_AGREEMENT,
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.changes.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.inconsistencies).toBeDefined();
  });

  // 4. POST /api/ask valid grounded query
  it('4. POST /api/ask returns grounded answer with citations', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({
        question: 'What is the monthly rent and when is it due?',
        documentText: SAMPLE_RENTAL_AGREEMENT,
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.answerable).toBe(true);
    expect(res.body.data.citations.length).toBeGreaterThanOrEqual(1);
  });

  // 5. POST /api/ask ungrounded query triggers abstention
  it('5. POST /api/ask abstains on questions not addressed in document', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({
        question: 'Can I keep a pet elephant on the balcony?',
        documentText: SAMPLE_RENTAL_AGREEMENT,
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.answerable).toBe(false);
    expect(res.body.data.answer).toContain('does not appear to address');
    expect(res.body.data.suggestedQuestions.length).toBeGreaterThanOrEqual(1);
  });

  // 6. POST /api/ask advice-seeking triggers boundary notice
  it('6. POST /api/ask injects boundary notice for advice-seeking queries', async () => {
    const res = await request(app)
      .post('/api/ask')
      .send({
        question: 'Should I sue the landlord for the security deposit?',
        documentText: SAMPLE_RENTAL_AGREEMENT,
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.boundaryNotice).toBeDefined();
    expect(res.body.data.boundaryNotice).toContain('Legal Boundary Notice');
  });

  // 7. POST /api/brief generates Lawyer Prep Brief
  it('7. POST /api/brief returns structured consultation pack', async () => {
    const res = await request(app)
      .post('/api/brief')
      .send({
        documentTitle: 'Sample Residential Lease',
        documentText: SAMPLE_RENTAL_AGREEMENT,
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.prioritizedQuestions.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.legalAidInfo.helpline).toBe('15100');
  });

  // 8. POST /api/export HTML format
  it('8. POST /api/export returns accessible HTML with legal disclaimer', async () => {
    const res = await request(app)
      .post('/api/export')
      .send({
        type: 'brief',
        format: 'html',
        data: { title: 'Test Brief', questions: ['Question 1'] },
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Important Notice:');
    expect(res.text).toContain('NyayaLens AI');
  });

  // 9. POST /api/export plain text format
  it('9. POST /api/export returns plain text format with disclaimer header', async () => {
    const res = await request(app)
      .post('/api/export')
      .send({
        type: 'summary',
        format: 'txt',
        data: { title: 'Test Summary' },
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('DISCLAIMER:');
  });

  // 10. Malformed payload returns 400 VALIDATION_ERROR
  it('10. returns 400 VALIDATION_ERROR on missing required fields', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({}); // missing text

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // 11. Empty string text returns 400 VALIDATION_ERROR
  it('11. returns 400 VALIDATION_ERROR when document text is empty', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ text: '' });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // 12. Error handler never leaks stack traces in response
  it('12. ensures API responses never leak internal stack traces', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ text: '' });

    expect(res.body.stack).toBeUndefined();
    expect(res.body.error.stack).toBeUndefined();
  });

  // 13. Cache hit avoids recomputation
  it('13. caching mechanism registers hits on repeated identical queries', async () => {
    analysisCache.clear();
    const payload = {
      title: 'Cache Test Agreement',
      text: SAMPLE_RENTAL_AGREEMENT,
    };

    // First request - miss
    await request(app).post('/api/analyze').send(payload);
    const initialStats = analysisCache.getStats();

    // Second request - hits
    await request(app).post('/api/analyze').send(payload);
    const afterStats = analysisCache.getStats();

    expect(afterStats.hits).toBeGreaterThan(initialStats.hits);
  });

  // 14. Zero-log hygiene: assert console spy does NOT log document text or user questions
  it('14. log hygiene: structured logger never logs document text or user questions', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await request(app)
      .post('/api/ask')
      .send({
        question: 'TOP_SECRET_QUESTION_12345',
        documentText: 'TOP_SECRET_DOCUMENT_BODY_67890',
      });

    const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
    const leakedQuestion = calls.some((c) => c.includes('TOP_SECRET_QUESTION_12345'));
    const leakedDoc = calls.some((c) => c.includes('TOP_SECRET_DOCUMENT_BODY_67890'));

    expect(leakedQuestion).toBe(false);
    expect(leakedDoc).toBe(false);

    consoleSpy.mockRestore();
  });

  // 15. Serves index.html for root path and SPA fallback
  it('15. frontend SPA routing serves index.html with 200 OK', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<!DOCTYPE html>');
  });

  // 16. CORS on API routes allows onrender.com and does not 500 on unlisted origins
  it('16. CORS allows onrender.com origins and omits headers gracefully without 500', async () => {
    const prevEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const resAllowed = await request(app)
        .get('/api/health')
        .set('Origin', 'https://nyayalens-ai.onrender.com');
      expect(resAllowed.status).toBe(200);
      expect(resAllowed.headers['access-control-allow-origin']).toBe('https://nyayalens-ai.onrender.com');

      const resUnlisted = await request(app)
        .get('/api/health')
        .set('Origin', 'https://untrusted-attacker.com');
      expect(resUnlisted.status).toBe(200);
      expect(resUnlisted.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  // 17. POST /api/ask supports SSE event-stream chunking
  it('17. POST /api/ask supports text/event-stream streaming with data chunks', async () => {
    const res = await request(app)
      .post('/api/ask?stream=true')
      .set('Accept', 'text/event-stream')
      .send({
        question: 'What is the monthly rent?',
        documentText: SAMPLE_RENTAL_AGREEMENT,
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('data:');
    expect(res.text).toContain('"complete":true');
  });
});
