
import express from 'express';
import passport from 'passport';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import { authRoutes } from './routes/authRoutes.js';
import { contentRoutes } from './routes/contentRoutes.js';
import { storeRoutes } from './routes/storeRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { webhookRoutes } from './routes/webhookRoutes.js';
import { contactRoutes } from './routes/contactRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { CLIENT_URL } from './services/config.js';

export const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === CLIENT_URL) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token']
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
  return csrfProtection(req, res, next);
});

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use('/api/auth', authRoutes);
app.use('/api', contentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use(errorHandler);
