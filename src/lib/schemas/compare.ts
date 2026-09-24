import { z } from 'zod';
import { sourceSpanSchema } from './common.ts';

/**
 * Individual clause change record.
 */
export const compareChangeSchema = z.object({
  kind: z.enum(['added', 'removed', 'modified', 'unchanged']),
  leftClauseId: z.string().optional(),
  rightClauseId: z.string().optional(),
  leftTitle: z.string().optional(),
  rightTitle: z.string().optional(),
  leftText: z.string().optional(),
  rightText: z.string().optional(),
  materiality: z.enum(['minor', 'moderate', 'major']),
  explanation: z.string(),
  spans: z.array(sourceSpanSchema).default([]),
});
export type CompareChange = z.infer<typeof compareChangeSchema>;

/**
 * Detected document inconsistency.
 */
export const inconsistencySchema = z.object({
  description: z.string(),
  spans: z.array(sourceSpanSchema).default([]),
});
export type Inconsistency = z.infer<typeof inconsistencySchema>;

/**
 * Full compare result schema.
 */
export const compareResultSchema = z.object({
  changes: z.array(compareChangeSchema),
  inconsistencies: z.array(inconsistencySchema).default([]),
  summary: z.string().default(''),
});
export type CompareResult = z.infer<typeof compareResultSchema>;

/**
 * Compare request payload schema.
 */
export const compareRequestSchema = z.object({
  leftTitle: z.string().max(200).default('Original Document'),
  leftText: z.string().min(1).max(200000),
  rightTitle: z.string().max(200).default('Revised Document'),
  rightText: z.string().min(1).max(200000),
});
export type CompareRequest = z.infer<typeof compareRequestSchema>;
