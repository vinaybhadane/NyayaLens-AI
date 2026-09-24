import { z } from 'zod';
import { sourceSpanSchema } from './common.ts';

/**
 * Grounded Q&A answer schema.
 */
export const qaAnswerSchema = z.object({
  answerable: z.boolean(),
  answer: z.string(),
  citations: z.array(sourceSpanSchema).default([]),
  confidence: z.enum(['low', 'medium', 'high']),
  suggestedQuestions: z.array(z.string()).default([]),
  boundaryNotice: z.string().optional(),
});
export type QaAnswer = z.infer<typeof qaAnswerSchema>;

/**
 * Q&A request payload.
 */
export const qaRequestSchema = z.object({
  question: z.string().min(1).max(1000),
  documentText: z.string().min(1).max(200000),
  clauses: z.array(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      original: z.string(),
    })
  ).optional(),
});
export type QaRequest = z.infer<typeof qaRequestSchema>;
