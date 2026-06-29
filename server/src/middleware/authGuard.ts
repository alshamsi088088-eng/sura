
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma.js';
import { JWT_SECRET } from '../services/config.js';

export async function authGuard(req: Request, res: Response, next: NextFunction) {
  let user = null;

  // Try cookie token first (server JWT from server login)
  const cookieToken = req.cookies.token;
  if (cookieToken) {
    try {
      const payload: any = jwt.verify(cookieToken, JWT_SECRET);
      user = await prisma.user.findUnique({ where: { id: payload.userId } });
    } catch {
      // Cookie token invalid or expired
    }
  }

  // If no valid cookie, check Authorization header for Supabase access token
  if (!user) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      try {
        // Dynamic import Supabase client
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: { user: supabaseUser } } = await supabase.auth.getUser(accessToken);
          if (supabaseUser?.id) {
            // Fetch user from database
            // Try ID first (works for server-created users), fallback to email (for Supabase-created users)
            user = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
            if (!user && supabaseUser.email) {
              user = await prisma.user.findUnique({ where: { email: supabaseUser.email } });
            }
          }
        }
      } catch {
        // Supabase verification failed
      }
    }
  }

  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  req.user = user;
  next();
}
