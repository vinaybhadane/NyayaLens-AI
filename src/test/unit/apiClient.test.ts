import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiError } from '@/services/apiClient.ts';

describe('Parameter 2 & 4 — apiClient Unit Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('analyzeDocument successfully calls /api/analyze and parses response', async () => {
    const mockData = { title: 'Test Document', clauses: [] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: mockData }),
    } as Response);

    const res = await apiClient.analyzeDocument({
      title: 'Test',
      text: 'Sample contract text',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/analyze',
      expect.objectContaining({ method: 'POST' })
    );
    expect(res).toEqual(mockData);
  });

  it('compareDocuments successfully calls /api/compare and parses response', async () => {
    const mockCompare = { leftTitle: 'Old', rightTitle: 'New', changes: [] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: mockCompare }),
    } as Response);

    const res = await apiClient.compareDocuments({
      leftTitle: 'Old',
      leftText: 'Text 1',
      rightTitle: 'New',
      rightText: 'Text 2',
    });

    expect(res).toEqual(mockCompare);
  });

  it('askQuestion successfully calls /api/ask and parses answer', async () => {
    const mockAnswer = { answer: 'Rent is 25000', citations: [], answerable: true };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: mockAnswer }),
    } as Response);

    const res = await apiClient.askQuestion({
      question: 'What is rent?',
      documentText: 'Rent is 25000',
    });

    expect(res).toEqual(mockAnswer);
  });

  it('generateBrief successfully calls /api/brief and returns lawyer dossier', async () => {
    const mockBrief = { title: 'Consultation Brief', prioritizedQuestions: [] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: mockBrief }),
    } as Response);

    const res = await apiClient.generateBrief({
      documentTitle: 'Test Lease',
      documentText: 'Lease text',
    });

    expect(res).toEqual(mockBrief);
  });

  it('checkHealth successfully returns health status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: { ok: true, status: 'healthy', cache: {} } }),
    } as Response);

    const res = await apiClient.checkHealth();
    expect(res.status).toBe('healthy');
  });

  it('exportData returns a Blob when request succeeds', async () => {
    const mockBlob = new Blob(['sample export content'], { type: 'text/plain' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => mockBlob,
    } as unknown as Response);

    const res = await apiClient.exportData({
      type: 'summary',
      format: 'txt',
      data: { test: true },
    });

    expect(res).toBeDefined();
    expect(res.size).toBe(mockBlob.size);
  });

  it('exportData throws ApiError when server returns non-ok status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);

    await expect(
      apiClient.exportData({
        type: 'summary',
        format: 'txt',
        data: {},
      })
    ).rejects.toThrow(ApiError);
  });

  it('throws ApiError with error details on API response failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' },
      }),
    } as Response);

    await expect(
      apiClient.analyzeDocument({ title: 'Test', text: '' })
    ).rejects.toThrow(ApiError);
  });
});
