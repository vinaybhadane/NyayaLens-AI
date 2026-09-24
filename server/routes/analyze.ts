import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.ts';
import { aiLimiter } from '../middleware/rateLimit.ts';
import { analyzeRequestSchema } from '../../src/lib/schemas/document.ts';
import { splitIntoClauses } from '../../src/lib/segmentation/clauseSplitter.ts';
import { extractDeadlinesAndDates } from '../../src/lib/dates/dateExtractor.ts';
import { aiOrchestrator } from '../ai/orchestrator.ts';
import { DocumentAnalysis } from '../../src/lib/schemas/document.ts';

const router = Router();

/**
 * POST /api/analyze
 * Segments document, extracts dates, classifies clauses, and rates risks.
 */
router.post(
  '/',
  aiLimiter,
  validateBody(analyzeRequestSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, text, targetLanguage } = req.body;

      // 1. Deterministic segmentation before any AI call
      const clauses = splitIntoClauses(text);

      // 2. Deterministic timeline and deadline extraction
      const timeline = extractDeadlinesAndDates(clauses);

      // 3. AI clause analysis with LRU caching and grounding
      const analyzedClauses = await aiOrchestrator.analyzeClauses(clauses, targetLanguage);

      // 4. Calculate aggregate risk summary
      let low = 0;
      let medium = 0;
      let high = 0;

      for (const c of analyzedClauses) {
        if (c.risk === 'high') high++;
        else if (c.risk === 'medium') medium++;
        else low++;
      }

      const total = analyzedClauses.length || 1;
      const overallScore = Math.min(100, Math.round(((high * 3 + medium * 1.5) / (total * 3)) * 100));

      const analysis: DocumentAnalysis = {
        id: `doc-${Date.now()}`,
        title: title || 'Analyzed Agreement',
        summary: `Document containing ${clauses.length} structured clauses. Risk evaluation identified ${high} high-risk provisions and ${medium} clauses requiring clarification.`,
        clauses: analyzedClauses,
        riskSummary: {
          low,
          medium,
          high,
          overallScore,
        },
        timeline,
        language: targetLanguage,
        createdAt: new Date().toISOString(),
      };

      res.json({ ok: true, data: analysis });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
