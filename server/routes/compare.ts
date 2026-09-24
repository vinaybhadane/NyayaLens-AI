import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.ts';
import { aiLimiter } from '../middleware/rateLimit.ts';
import { compareRequestSchema } from '../../src/lib/schemas/compare.ts';
import { splitIntoClauses } from '../../src/lib/segmentation/clauseSplitter.ts';
import { alignAndDiffClauses } from '../../src/lib/diff/textDiff.ts';
import { aiOrchestrator } from '../ai/orchestrator.ts';

const router = Router();

/**
 * POST /api/compare
 * Semantically compares two documents, surfacing added, removed, and modified terms.
 */
router.post(
  '/',
  aiLimiter,
  validateBody(compareRequestSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { leftText, rightText } = req.body;

      // 1. Deterministic segmentation
      const leftClauses = splitIntoClauses(leftText);
      const rightClauses = splitIntoClauses(rightText);

      // 2. Pure deterministic alignment and diffing
      const alignedChanges = alignAndDiffClauses(leftClauses, rightClauses);

      // 3. AI review for nuanced inconsistencies and summary
      const result = await aiOrchestrator.compareDocuments(leftText, rightText, alignedChanges);

      res.json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
