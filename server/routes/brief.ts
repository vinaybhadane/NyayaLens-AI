import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.ts';
import { aiLimiter } from '../middleware/rateLimit.ts';
import { briefRequestSchema } from '../../src/lib/schemas/brief.ts';
import { splitIntoClauses } from '../../src/lib/segmentation/clauseSplitter.ts';
import { aiOrchestrator } from '../ai/orchestrator.ts';

const router = Router();

/**
 * POST /api/brief
 * Generates a structured Lawyer Prep Brief.
 */
router.post(
  '/',
  aiLimiter,
  validateBody(briefRequestSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { documentTitle, documentText } = req.body;
      const clauses = splitIntoClauses(documentText);

      const brief = await aiOrchestrator.generateBrief(documentTitle, documentText, clauses);
      res.json({ ok: true, data: brief });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
