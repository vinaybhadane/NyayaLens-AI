import { Request, Response, NextFunction } from 'express';

export interface StructuredLog {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  contentLength: number;
}

/**
 * Structured request logger strictly compliant with Zero-Trust Log Hygiene.
 * NEVER logs document contents, questions, or sensitive payload text.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const contentLength = Number(res.getHeader('content-length')) || 0;

    const logEntry: StructuredLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.baseUrl + req.path,
      status: res.statusCode,
      durationMs,
      contentLength,
    };

    // Output formatted JSON metadata only
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
}
