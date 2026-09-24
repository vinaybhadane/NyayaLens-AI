import { z } from 'zod';

/**
 * Supported risk levels for legal clauses.
 */
export const riskLevelSchema = z.enum(['low', 'medium', 'high']);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

/**
 * Standard clause classification types.
 */
export const clauseTypeSchema = z.enum([
  'payment',
  'term',
  'termination',
  'renewal',
  'liability',
  'indemnity',
  'confidentiality',
  'ip',
  'non_compete',
  'dispute_resolution',
  'jurisdiction',
  'other',
]);
export type ClauseType = z.infer<typeof clauseTypeSchema>;

/**
 * Supported reading levels for plain-language rewrites.
 */
export const readingLevelSchema = z.enum(['simple', 'standard', 'detailed']);
export type ReadingLevel = z.infer<typeof readingLevelSchema>;

/**
 * Supported language codes.
 */
export const languageCodeSchema = z.enum(['en', 'hi', 'mr']);
export type LanguageCode = z.infer<typeof languageCodeSchema>;

/**
 * Grounded source span pointing to original document text.
 */
export const sourceSpanSchema = z.object({
  clauseId: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  quote: z.string(),
});
export type SourceSpan = z.infer<typeof sourceSpanSchema>;
