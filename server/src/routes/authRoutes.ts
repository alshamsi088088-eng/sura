
import { Router } from 'express';
import { login, logout, me, register, googleAuthRedirect, googleAuthCallback, appleAuthRedirect, appleAuthCallback, profile, refreshToken, forgotPassword, resetPassword, verifyEmail, AuthCallback } from '../controllers/authController.js';
import { authGuard } from '../middleware/authGuard.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
authRoutes.post('/refresh', refreshToken);
authRoutes.post('/forgot', forgotPassword);
authRoutes.post('/reset', resetPassword);
authRoutes.get('/verify', verifyEmail);
authRoutes.get('/profile', authGuard, me);
authRoutes.get('/google', googleAuthRedirect);
authRoutes.get('/google/callback', googleAuthCallback);
authRoutes.get('/apple', appleAuthRedirect);
authRoutes.all('/apple/callback', appleAuthCallback);
authRoutes.get('/me', authGuard, profile);
authRoutes.post('/', AuthCallback);
