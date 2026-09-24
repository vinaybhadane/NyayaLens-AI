import {
  DocumentAnalysis,
  AnalyzeRequest,
  CompareResult,
  CompareRequest,
  QaAnswer,
  QaRequest,
  LawyerBrief,
  BriefRequest,
  ExportRequest,
} from '../lib/schemas/index.ts';

const API_BASE = '/api';

export class ApiError extends Error {
  public code: string;
  public details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const body = await response.json();

  if (!response.ok || !body.ok) {
    const error = body.error || { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred.' };
    throw new ApiError(error.code, error.message, error.details);
  }

  return body.data as T;
}

export const apiClient = {
  analyzeDocument: (data: AnalyzeRequest): Promise<DocumentAnalysis> => {
    return request<DocumentAnalysis>('/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  compareDocuments: (data: CompareRequest): Promise<CompareResult> => {
    return request<CompareResult>('/compare', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  askQuestion: (data: QaRequest): Promise<QaAnswer> => {
    return request<QaAnswer>('/ask', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  generateBrief: (data: BriefRequest): Promise<LawyerBrief> => {
    return request<LawyerBrief>('/brief', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  exportData: async (data: ExportRequest): Promise<Blob> => {
    const response = await fetch(`${API_BASE}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError('EXPORT_FAILED', 'Failed to generate export file.');
    }

    return response.blob();
  },

  checkHealth: (): Promise<{ ok: boolean; status: string; cache: unknown }> => {
    return request<{ ok: boolean; status: string; cache: unknown }>('/health');
  },
};
