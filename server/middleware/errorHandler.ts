import { Request, Response, NextFunction } from 'express';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'SECURITY_VIOLATION';

/**
 * Custom application error with HTTP status and stable machine-readable code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Centralized error handler middleware.
 * Never leaks stack traces or raw AI provider exceptions in responses.
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Handle SyntaxError from malformed JSON payloads
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON payload received.',
      },
    });
    return;
  }

  // Generic fallback without leaking internal details
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'An unexpected error occurred. Please try again.' : err.message,
    },
  });
}
