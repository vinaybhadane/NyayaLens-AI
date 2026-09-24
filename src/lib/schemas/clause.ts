import { z } from 'zod';
import { clauseTypeSchema, riskLevelSchema, sourceSpanSchema } from './common.ts';

/**
 * Extracted legal obligation.
 */
export const obligationSchema = z.object({
  party: z.string(),
  action: z.string(),
  dueDate: z.string().optional(),
});
export type Obligation = z.infer<typeof obligationSchema>;

/**
 * Actionable option for a flagged clause.
 */
export const clauseOptionSchema = z.object({
  category: z.enum(['negotiate', 'clarify', 'seek_counsel', 'request_amendment']),
  title: z.string(),
  description: z.string(),
  sampleWording: z.string().optional(),
});
export type ClauseOption = z.infer<typeof clauseOptionSchema>;

/**
 * Full analysis of an individual clause.
 */
export const clauseAnalysisSchema = z.object({
  id: z.string(),
  type: clauseTypeSchema,
  title: z.string().default('Clause'),
  original: z.string(),
  plain: z.object({
    en: z.string(),
    hi: z.string(),
    mr: z.string(),
  }),
  risk: riskLevelSchema,
  riskReason: z.string(),
  obligations: z.array(obligationSchema).default([]),
  options: z.array(clauseOptionSchema).default([]),
  spans: z.array(sourceSpanSchema).default([]),
  verified: z.boolean().default(false),
});
export type ClauseAnalysis = z.infer<typeof clauseAnalysisSchema>;
