import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import { RequestHandler } from 'express';

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

/**
 * Parses allowed origins from environment.
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (!envOrigins) return [...defaultAllowedOrigins];
  return envOrigins.split(',').map((o) => o.trim()).filter(Boolean);
}

/**
 * Checks whether an origin is allowed by explicit list or trusted patterns.
 */
function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    // Allow any onrender.com domain (Render production, staging, PR previews)
    if (hostname.endsWith('.onrender.com') || hostname === 'onrender.com') return true;
    // Allow localhost and 127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  } catch {
    return false;
  }

  return false;
}

/**
 * Dynamic CORS configuration.
 */
export const corsMiddleware = (): RequestHandler => {
  const allowed = getAllowedOrigins();
  if (process.env.RENDER_EXTERNAL_URL) {
    allowed.push(process.env.RENDER_EXTERNAL_URL);
  }

  const options: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server, direct navigation)
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV !== 'production' || isOriginAllowed(origin, allowed)) {
        return callback(null, true);
      }

      // Do NOT pass an Error to callback - doing so causes Express to trigger
      // the 500 errorHandler. Passing callback(null, false) safely omits
      // CORS headers as expected by the CORS specification.
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };

  return cors(options);
};

/**
 * Hardened Helmet security headers.
 */
export const helmetMiddleware = (): RequestHandler => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: [
          "'self'",
          'https://generativelanguage.googleapis.com',
          'https://identitytoolkit.googleapis.com',
          'https://securetoken.googleapis.com',
          'https://firestore.googleapis.com',
        ],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    noSniff: true,
  });
};
