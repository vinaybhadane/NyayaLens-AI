import { z } from 'zod';
import { sourceSpanSchema } from './common.ts';

/**
 * Question prioritized for consultation with a lawyer.
 */
export const lawyerQuestionSchema = z.object({
  id: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  topic: z.string(),
  question: z.string(),
  contextFromDoc: z.string(),
  suggestedGoal: z.string(),
});
export type LawyerQuestion = z.infer<typeof lawyerQuestionSchema>;

/**
 * Complete structured Lawyer Prep Brief.
 */
export const lawyerBriefSchema = z.object({
  documentTitle: z.string(),
  preparedDate: z.string(),
  keyParties: z.array(z.string()),
  corePurpose: z.string(),
  criticalDeadlines: z.array(z.string()),
  highRiskClauses: z.array(
    z.object({
      clauseId: z.string(),
      title: z.string(),
      concern: z.string(),
      spans: z.array(sourceSpanSchema).default([]),
    })
  ),
  ambiguitiesOrMissingTerms: z.array(z.string()),
  prioritizedQuestions: z.array(lawyerQuestionSchema),
  legalAidInfo: z.object({
    organization: z.string(),
    helpline: z.string(),
    website: z.string(),
    eligibilityNote: z.string(),
  }),
});
export type LawyerBrief = z.infer<typeof lawyerBriefSchema>;

/**
 * Brief generation request.
 */
export const briefRequestSchema = z.object({
  documentId: z.string().optional(),
  documentTitle: z.string(),
  documentText: z.string().min(1).max(200000),
  jurisdiction: z.string().optional().default('India'),
});
export type BriefRequest = z.infer<typeof briefRequestSchema>;

/**
 * Export request schema.
 */
export const exportRequestSchema = z.object({
  type: z.enum(['brief', 'summary', 'full']),
  format: z.enum(['html', 'txt', 'markdown']),
  data: z.any(),
});
export type ExportRequest = z.infer<typeof exportRequestSchema>;
