import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma.js';
import { JWT_SECRET } from '../services/config.js';

export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    let user: any = null;

    // Try cookie token first (server JWT)
    const cookieToken = req.cookies?.token;
    if (cookieToken) {
      try {
        const payload: any = jwt.verify(cookieToken, JWT_SECRET);
        user = await prisma.user.findUnique({ where: { id: payload.userId } });
      } catch {
        // ignore invalid cookie
      }
    }

    // If no valid cookie, check Authorization header for Supabase access token
    if (!user) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const accessToken = authHeader.substring(7);
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_ANON_KEY;

          if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const {
              data: { user: supabaseUser },
            } = await supabase.auth.getUser(accessToken);

            if (supabaseUser?.id) {
              // ID lookup
              try {
                user = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
              } catch {
                user = null;
              }

              // Fallback to email lookup
              if (!user && supabaseUser.email) {
                try {
                  user = await prisma.user.findUnique({ where: { email: supabaseUser.email } });
                } catch {
                  user = null;
                }
              }
            }
          }
        } catch {
          // ignore supabase verification failures
        }
      }
    }

    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    (req as any).user = user;
    return next();
  } catch {
    // Ensure the guard never crashes the server
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

