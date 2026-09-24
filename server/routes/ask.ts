import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validate.ts';
import { aiLimiter } from '../middleware/rateLimit.ts';
import { qaRequestSchema } from '../../src/lib/schemas/qa.ts';
import { splitIntoClauses } from '../../src/lib/segmentation/clauseSplitter.ts';
import { aiOrchestrator } from '../ai/orchestrator.ts';
import { detectAdviceSeeking } from '../../src/lib/boundary/adviceDetector.ts';

const router = Router();

/**
 * POST /api/ask
 * Grounded Q&A with deterministic citation verification, abstention, and streaming SSE support.
 */
router.post(
  '/',
  aiLimiter,
  validateBody(qaRequestSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { question, documentText, clauses } = req.body;

      const boundaryCheck = detectAdviceSeeking(question);
      const parsedClauses = clauses && clauses.length > 0
        ? clauses.map((c: { id: string; title?: string; original: string }) => ({
            id: c.id,
            title: c.title || 'Clause',
            text: c.original,
            startIndex: 0,
            endIndex: c.original.length,
          }))
        : splitIntoClauses(documentText);

      const isStream = req.headers.accept === 'text/event-stream' || req.query['stream'] === 'true';

      if (isStream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const answer = await aiOrchestrator.answerQuestion(question, documentText, parsedClauses);
        if (boundaryCheck.boundaryNotice) {
          answer.boundaryNotice = boundaryCheck.boundaryNotice;
        }

        // Stream tokens in chunks to simulate/demonstrate live generation
        const words = answer.answer.split(' ');
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(' ') + ' ';
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }

        res.write(`data: ${JSON.stringify({ complete: true, data: answer })}\n\n`);
        res.end();
        return;
      }

      const answer = await aiOrchestrator.answerQuestion(question, documentText, parsedClauses);
      if (boundaryCheck.boundaryNotice) {
        answer.boundaryNotice = boundaryCheck.boundaryNotice;
      }

      res.json({ ok: true, data: answer });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
