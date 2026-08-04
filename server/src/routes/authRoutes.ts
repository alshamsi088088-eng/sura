
import { Router } from 'express';
import { login, logout, me, register, googleAuthRedirect, googleAuthCallback, appleAuthRedirect, appleAuthCallback, profile, refreshToken, forgotPassword, resetPassword, verifyEmail, AuthCallback } from '../controllers/authController.js';
import { authGuard } from '../middleware/authGuard.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

export const authRoutes = Router();

// Rate-limit sensitive auth endpoints to prevent brute-force attacks
const authRateLimit = rateLimiter(10, 60); // 10 requests per 60 seconds per IP

authRoutes.post('/register', authRateLimit, register);
authRoutes.post('/login', authRateLimit, login);
authRoutes.post('/logout', logout);
authRoutes.post('/refresh', refreshToken);
authRoutes.post('/forgot', authRateLimit, forgotPassword);
authRoutes.post('/reset', authRateLimit, resetPassword);
authRoutes.get('/verify', verifyEmail);
authRoutes.get('/profile', authGuard, me);
authRoutes.get('/google', googleAuthRedirect);
authRoutes.get('/google/callback', googleAuthCallback);
authRoutes.get('/apple', appleAuthRedirect);
authRoutes.all('/apple/callback', appleAuthCallback);
authRoutes.get('/me', authGuard, profile);
authRoutes.post('/', AuthCallback);
