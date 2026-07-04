
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
import { errorHandler } from './middleware/errorHandler.js';
import { ALLOWED_ORIGINS_STR } from './services/config.js';

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
 * ✅ CORS Production-Fix: السماح فقط بـ www domain
 * إصلاح مشكلة 308 redirect ومنع ازدواجية origins
 *
 *_rules:_
 * - ✅_allowed Origins: www.sura-codex.com و localhost فقط
 * - ✅_non-www domain = لا يُسمح (يسبب 308 redirect)
 * - ✅_credentials = مفعل
 * - ✅_preflight = مُعالج بشكل صحيح
 */
const isProduction = process.env.NODE_ENV === 'production';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no origin (server-to-server, curl, Postman)
      if (!origin) {
        callback(null, true);
        return;
      }

      // ✅ Normalize origin - remove trailing slash
      const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

      // Production: allow ONLY https://sura-codex.com (no www)
      if (isProduction) {
        const allowed = normalizedOrigin === 'https://sura-codex.com';
        if (allowed) return callback(null, true);

        console.log(`CORS REJECTED in production: ${normalizedOrigin}`);
        return callback(new Error('Not allowed by CORS'), false);
      }

      // Development: allow configured local origins
      if (ALLOWED_ORIGINS_STR.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.log(`CORS REJECTED in dev: ${normalizedOrigin}`);
      return callback(new Error('Not allowed by CORS (dev)'), false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    exposedHeaders: ['Content-Length', 'X-CSRF-Token', 'X-Frame-Options'],
    // Railway proxy compatible settings
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
app.use('/api/store', storeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// SEO: robots.txt + sitemap.xml
app.use('/', seoRouter);

app.use(errorHandler);

