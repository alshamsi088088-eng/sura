<<<<<<< HEAD
Import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
const { TokenExpiredError, JsonWebTokenError } = jwt as any;
import passport from 'passport';
import { prisma } from '../services/prisma.js';
import { createTokenPair, sendAuthCookies } from '../services/tokenService.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { initGoogleStrategy } from '../services/passportConfig.js';
import { JWT_REFRESH_SECRET } from '../services/config.js';

initGoogleStrategy();

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'member',
        locale: 'en',
        theme: 'dark',
        verified: false,
        verificationToken
      }
    });
    await sendVerificationEmail(user, verificationToken);
    const tokens = createTokenPair(user.id);
    sendAuthCookies(res, tokens);
    res.json({ user: sanitize(user) });
    await sendWelcomeEmail(user);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const tokens = createTokenPair(user.id);
    sendAuthCookies(res, tokens);
    res.json({ user: sanitize(user) });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.json({ success: true });
}

export async function refreshToken(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'Missing refresh token' });
  try {
    const payload: any = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    const tokens = createTokenPair(user.id);
    sendAuthCookies(res, tokens);
    res.json({ user: sanitize(user) });
  } catch (error: any) {
    // Return proper error codes based on error type
    if (error instanceof TokenExpiredError) {
      res.status(401).json({ message: 'Refresh token expired' });
    } else if (error instanceof JsonWebTokenError || error.name === 'JsonWebTokenError') {
      res.status(400).json({ message: 'Invalid refresh token format' });
    } else {
      // Log the actual error for debugging
      console.error('Refresh token error:', error.message);
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(200).json({ message: 'If an account exists, a reset link has been sent' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.user.update({ where: { email }, data: { resetToken, resetTokenExpires: expires } });
    await sendPasswordResetEmail(email, resetToken);
    res.json({ message: 'If an account exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });
    const user = await prisma.user.findFirst({ where: { resetToken: token, resetTokenExpires: { gt: new Date() } } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed, resetToken: null, resetTokenExpires: null } });
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') return res.status(400).json({ message: 'Invalid verification token' });
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) return res.status(400).json({ message: 'Verification token is invalid or expired' });
    await prisma.user.update({ where: { id: user.id }, data: { verified: true, verificationToken: null } });
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response) {
  res.json({ user: req.user });
}

export async function profile(req: Request, res: Response) {
  res.json({ user: req.user });
}

export function googleAuthRedirect(req: Request, res: Response, next: NextFunction) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(501).json({ message: 'Google Sign In is not configured' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
}

export function googleAuthCallback(req: Request, res: Response, next: NextFunction) {
  passport.authenticate('google', { session: false }, async (err, profile) => {
    if (err || !profile) return res.redirect('/login');
    const email = profile.email;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: profile.name,
          email,
          role: 'member',
          locale: 'en',
          theme: 'dark',
          verified: true
        }
      });
    }
    const tokens = createTokenPair(user.id);
    sendAuthCookies(res, tokens);
    const clientUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://sura-codex.com' : 'http://localhost:5173');
    res.redirect(clientUrl);
  })(req, res, next);
}

export async function appleAuthCallback(req: Request, res: Response) {
  const email = req.body.email || req.body.user?.email;
  const name = req.body.name || req.body.user?.name || 'Apple Reader';
  if (!email) {
    return res.status(400).json({ message: 'Apple authentication failed' });
  }
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        role: 'member',
        locale: 'en',
        theme: 'dark',
        verified: true
      }
    });
  }
  const tokens = createTokenPair(user.id);
  sendAuthCookies(res, tokens);
  const clientUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://sura-codex.com' : 'http://localhost:5173');
  res.redirect(clientUrl);
}

// Supabase Auth callback - handles Supabase identity verification
export async function AuthCallback(req: Request, res: Response) {
  try {
    const accessToken = req.body.access_token;
    const refreshToken = req.body.refresh_token;

    if (!accessToken) return res.status(400).json({ message: 'Missing access_token' });

    // Verify with Supabase - the token is already validated on client side via Supabase auth
    // This endpoint receives the user info directly from Supabase after authentication
    const { email, user_metadata, app_metadata } = req.body;

    if (!email) return res.status(400).json({ message: 'Token does not contain an email' });

    let user = await prisma.user.findUnique({ where: { email } });
=======
import { Request, Response, NextFunction } from 'express'; // تم تصحيح حرف i ليكون صغيرًا

import { prisma } from '../services/prisma.js';
import { createTokenPair, sendAuthCookies } from '../services/tokenService.js';

type AuthCallbackBody = {
  access_token?: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    avatarUrl?: string;
  };
};

function sanitize<T extends Record<string, any> | null | undefined>(user: T) {
  if (!user) return user;

  const {
    password,
    resetToken,
    resetTokenExpires,
    ...safe
  } = user as any;

  return safe;
}

function getAdminRoleForEmail(email: string) {
  const myAdminEmail = 'thesuracodex@gmail.com';
  return email.toLowerCase() === myAdminEmail.toLowerCase() ? 'admin' : 'member';
}

// --------------------
// OAuth/Callback
// --------------------
export async function AuthCallback(req: Request, res: Response): Promise<any> { // إضافة نوع الإرجاع الوعدي
  try {
    const body = (req.body ?? {}) as AuthCallbackBody;
    const accessToken = body.access_token;

    if (!accessToken) {
      return res.status(400).json({ message: 'Missing access_token' });
    }

    const email = body.email;
    if (!email) {
      return res.status(400).json({ message: 'Token does not contain an email' });
    }

    const user_metadata = body.user_metadata;
    const role = getAdminRoleForEmail(email);

    let user = await prisma.user.findUnique({ where: { email } });

>>>>>>> 3de95a81743840dae025b0f1acd3799b419fc7c2
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: user_metadata?.full_name || user_metadata?.name || 'Reader',
          email,
<<<<<<< HEAD
          role: 'member',
=======
          role,
>>>>>>> 3de95a81743840dae025b0f1acd3799b419fc7c2
          locale: 'en',
          theme: 'dark',
          verified: true,
          avatar: user_metadata?.avatar_url ?? user_metadata?.avatarUrl ?? null
        }
      });
<<<<<<< HEAD
=======
    } else {
      if (user.role !== role) {
        user = await prisma.user.update({
          where: { email },
          data: { role }
        });
      }
>>>>>>> 3de95a81743840dae025b0f1acd3799b419fc7c2
    }

    const tokens = createTokenPair(user.id);
    sendAuthCookies(res, tokens);

    return res.json({ user: sanitize(user) });
  } catch (error: any) { // تحديد نوع الخطأ بـ any لمنع تعارض الـ compiler
    console.error('AuthCallback error', error);
    return res.status(500).json({ message: 'Auth processing failed' });
  }
}

<<<<<<< HEAD
export function appleAuthRedirect(req: Request, res: Response) {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) {
    return res.status(501).json({ message: 'Apple Sign In is not configured' });
  }
  // Use HTTPS in production
  const serverUrl = process.env.SERVER_URL || (process.env.NODE_ENV === 'production' ? 'https://sura-codex.com' : 'http://localhost:5000');
  const redirectUri = `${serverUrl}/api/auth/apple/callback`;
  const url = `https://appleid.apple.com/auth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=name%20email&response_mode=form_post`;
  res.redirect(url);
}

function sanitize(user: any) {
  const { password, resetToken, resetTokenExpires, verificationToken, ...rest } = user;
  return rest;
=======
// --------------------
// Placeholders / minimal implementations
// --------------------
export async function login(_req: Request, res: Response): Promise<any> {
  return res.status(501).json({ message: 'Not implemented (use Supabase OAuth / AuthCallback flow)' });
}

export async function logout(_req: Request, res: Response): Promise<any> {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  return res.json({ message: 'Logged out' });
}

export async function register(_req: Request, res: Response): Promise<any> {
  return res.status(501).json({ message: 'Not implemented' });
}

export async function me(req: Request, res: Response): Promise<any> {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return res.json({ user: sanitize(user) });
}


export async function profile(req: Request, res: Response): Promise<any> {
  return me(req, res);
}

export async function refreshToken(_req: Request, res: Response): Promise<any> {
  return res.status(501).json({ message: 'Not implemented' });
}

export async function forgotPassword(_req: Request, res: Response): Promise<any> {
  return res.status(501).json({ message: 'Not implemented' });
}

export async function resetPassword(_req: Request, res: Response): Promise<any> {
  return res.status(501).json({ message: 'Not implemented' });
}

export async function verifyEmail(_req: Request, res: Response): Promise<any> {
  return res.status(501).json({ message: 'Not implemented' });
}

export async function googleAuthRedirect(_req: Request, res: Response): Promise<any> {
  return res.status(501).json({ message: 'Not implemented' });
}

export async function googleAuthCallback(_req: Request, res: Response): Promise<any> {
  return res.status(501).json({ message: 'Not implemented' });
}

export async function appleAuthRedirect(_req: Request, res: Response): Promise<any> {
  return res.status(501).json({ message: 'Not implemented' });
}

export async function appleAuthCallback(_req: Request, res: Response): Promise<any> {
  return res.status(501).json({ message: 'Not implemented' });
>>>>>>> 3de95a81743840dae025b0f1acd3799b419fc7c2
}