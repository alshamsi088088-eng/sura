
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
import { CLIENT_URL, ALLOWED_ORIGINS_STR } from './services/config.js';

export const app = express();
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});
// --------------------------

app.set('trust proxy', 1);
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// CORS configuration for Railway HTTPS proxy - supports both www and non-www, and sameSite: none for cross-origin
// Also handle Railway's proxy URLs automatically
const RAILWAY_BACKEND_URL = process.env.RAILWAY_BACKEND_URL || '';
const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN || '';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no origin (e.g., mobile apps, curl)
      if (!origin) {
        callback(null, true);
        return;
      }
      // Normalize origin by removing trailing slash
      const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      // Check exact match or wildcard
      if (ALLOWED_ORIGINS_STR.includes(normalizedOrigin) || normalizedOrigin === CLIENT_URL) {
        callback(null, true);
      } else if (RAILWAY_BACKEND_URL && normalizedOrigin === RAILWAY_BACKEND_URL.replace(/\/$/, '')) {
        callback(null, true);
      } else if (RAILWAY_PUBLIC_DOMAIN && normalizedOrigin === RAILWAY_PUBLIC_DOMAIN.replace(/\/$/, '')) {
        callback(null, true);
      } else {
        // Log for debugging but still allow
        console.log(`CORS: Allowing origin ${origin}`);
        callback(null, true);
      }
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

