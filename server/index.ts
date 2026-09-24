import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { helmetMiddleware, corsMiddleware } from './middleware/security.ts';
import { generalLimiter } from './middleware/rateLimit.ts';
import { requestLogger } from './middleware/logger.ts';
import { errorHandler } from './middleware/errorHandler.ts';

import healthRouter from './routes/health.ts';
import analyzeRouter from './routes/analyze.ts';
import compareRouter from './routes/compare.ts';
import askRouter from './routes/ask.ts';
import briefRouter from './routes/brief.ts';
import exportRouter from './routes/export.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const port = Number(process.env.PORT) || 3001;

// 1. Security & Hygiene Middlewares
app.use(helmetMiddleware());
app.use(corsMiddleware());
app.use(generalLimiter);
app.use(requestLogger);

// 2. Request body parsing with strict 10MB bounds
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. API Routes
app.use('/api/health', healthRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/compare', compareRouter);
app.use('/api/ask', askRouter);
app.use('/api/brief', briefRouter);
app.use('/api/export', exportRouter);

// 3.5. Serve compiled frontend in production (Single Web Service on Render)
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// 4. Centralized Error Handler (no stack traces)
app.use(errorHandler);

// Only listen directly when not imported in tests
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`NyayaLens AI server active on http://localhost:${port}`);
  });
}

export default app;
