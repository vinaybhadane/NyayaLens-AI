import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import compression from 'compression';
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

// 1. Global Security, Compression & Logging
app.use(helmetMiddleware());
app.use(compression());
app.use(requestLogger);

// 2. Serve compiled frontend in production with high-efficiency HTTP caching
app.use(express.static(distPath, {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

// 3. API-specific Middlewares (CORS, Rate Limiter, Body Parsers)
app.use('/api', corsMiddleware());
app.use('/api', generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. API Routes
app.use('/api/health', healthRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/compare', compareRouter);
app.use('/api/ask', askRouter);
app.use('/api/brief', briefRouter);
app.use('/api/export', exportRouter);

// 5. Client-side Routing Fallback (SPA)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// 6. Centralized Error Handler (no stack traces)
app.use(errorHandler);

// Only listen directly when not imported in tests
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    const aiStatus = process.env.GEMINI_API_KEY ? 'Gemini 2.5 Active' : 'Offline Mock';
    console.log(`NyayaLens AI server active on http://localhost:${port} [AI Engine: ${aiStatus}]`);
  });
}

export default app;
