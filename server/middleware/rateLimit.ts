import rateLimit from 'express-rate-limit';

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000;
const maxAiRequests = Number(process.env.RATE_LIMIT_MAX_AI) || 20;

/**
 * Standard rate limiter for general routes.
 */
export const generalLimiter = rateLimit({
  windowMs,
  max: 120, // 120 reqs/min for general endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down and try again shortly.',
    },
  },
});

/**
 * Stricter rate limiter for expensive AI processing routes.
 */
export const aiLimiter = rateLimit({
  windowMs,
  max: maxAiRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit of ${maxAiRequests} AI requests per minute exceeded. Please wait a moment.`,
    },
  },
});
