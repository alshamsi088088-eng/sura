import express from 'express';
import passport from 'passport';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import { authRoutes } from './routes/authRoutes.js';
import { contentRoutes } from './routes/contentRoutes.js';
import { storeRoutes } from './routes/storeRoutes.js';
import { seoRouter } from './routes/seoRoutes.js';

import { adminRoutes } from './routes/adminRoutes.js';
import { webhookRoutes } from './routes/webhookRoutes.js';
import { contactRoutes } from './routes/contactRoutes.js';
import { partRoutes } from './routes/partRoutes.js';
import { engagementRoutes } from './routes/engagementRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { communityRoutes } from './routes/communityRoutes.js';
import { readingProgressRoutes } from './routes/readingProgressRoutes.js';
import { rssFeed } from './controllers/rssController.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ALLOWED_ORIGINS_LIST } from './services/config.js';

export const app = express();
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});
// --------------------------

app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * ✅ CORS — Unified across all environments.
 *
 * ALLOWED_ORIGINS_LIST (from config.ts) always includes:
 *   - https://sura-codex.com       (required production)
 *   - https://www.sura-codex.com   (required production — browser may send
 *                                   www origin even after a redirect)
 *   - localhost origins             (development)
 *   - any origins from ALLOWED_ORIGINS env var (additive only)
 *
 * This eliminates the brittle production/dev branch split. The origin list
 * is immutable for required domains and extensible via env var.
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no origin (server-to-server, curl, Postman, Railway health checks)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Normalize origin — remove trailing slash
      const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

      if (ALLOWED_ORIGINS_LIST.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      console.log(`CORS REJECTED: ${normalizedOrigin} (NODE_ENV=${process.env.NODE_ENV || 'unknown'})`);
      callback(new Error(`Origin '${normalizedOrigin}' is not allowed by CORS`), false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    exposedHeaders: ['Content-Length', 'X-CSRF-Token', 'X-Frame-Options'],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);


app.use(passport.initialize());

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  }
});

app.use((req, res, next) => {
  if (req.path === '/api/webhooks/stripe') {
    return next();
  }
  // Engagement routes are authenticated via Bearer token (CSRF-safe)
  // and the client never sends CSRF tokens, so exempt them.
  if (req.path.startsWith('/api/engagement/')) {
    return next();
  }
  return (csrfProtection as any)(req, res, next);
});

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use('/api/auth', authRoutes);
app.use('/api', contentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api', partRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api', readingProgressRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// SEO: robots.txt + sitemap.xml
app.use('/', seoRouter);

// RSS Feed
app.get('/api/rss', rssFeed);

app.use(errorHandler);
