import { z } from 'zod';
import { clauseAnalysisSchema } from './clause.ts';

/**
 * Extracted timeline event from document obligations or clauses.
 */
export const timelineEventSchema = z.object({
  id: z.string(),
  dateOrPeriod: z.string(),
  description: z.string(),
  clauseId: z.string(),
  type: z.enum(['notice', 'deadline', 'payment', 'renewal', 'effective', 'other']),
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

/**
 * Aggregate risk summary metrics.
 */
export const riskSummarySchema = z.object({
  low: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  overallScore: z.number().min(0).max(100),
});
export type RiskSummary = z.infer<typeof riskSummarySchema>;

/**
 * Complete document analysis result.
 */
export const documentAnalysisSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  clauses: z.array(clauseAnalysisSchema),
  riskSummary: riskSummarySchema,
  timeline: z.array(timelineEventSchema).default([]),
  language: z.string().default('en'),
  createdAt: z.string(),
});
export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

/**
 * Payload for requesting analysis.
 */
export const analyzeRequestSchema = z.object({
  title: z.string().max(200).default('Untitled Document'),
  text: z.string().min(1).max(200000), // max chars
  targetLanguage: z.enum(['en', 'hi', 'mr']).default('en'),
  readingLevel: z.enum(['simple', 'standard', 'detailed']).default('standard'),
  piiMasked: z.boolean().default(false),
});
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
