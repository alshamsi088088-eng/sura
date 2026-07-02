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

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: user_metadata?.full_name || user_metadata?.name || 'Reader',
          email,
          role,
          locale: 'en',
          theme: 'dark',
          verified: true,
          avatar: user_metadata?.avatar_url ?? user_metadata?.avatarUrl ?? null
        }
      });
    } else {
      if (user.role !== role) {
        user = await prisma.user.update({
          where: { email },
          data: { role }
        });
      }
    }

    const tokens = createTokenPair(user.id);
    sendAuthCookies(res, tokens);

    return res.json({ user: sanitize(user) });
  } catch (error: any) { // تحديد نوع الخطأ بـ any لمنع تعارض الـ compiler
    console.error('AuthCallback error', error);
    return res.status(500).json({ message: 'Auth processing failed' });
  }
}

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
  return res.json({ user: sanitize((req as any).user) });
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
}