import { Router, Request, Response } from 'express';
import { analysisCache } from '../cache/lruCache.ts';

const router = Router();

/**
 * Health check endpoint reporting service status and cache metrics.
 * Public, unauthenticated, minimal data.
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cache: analysisCache.getStats(),
  });
});

export default router;
