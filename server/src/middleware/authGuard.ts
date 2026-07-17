import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma.js';
import { JWT_SECRET } from '../services/config.js';

export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    let user: any = null;

    // 1. محاولة استخدام الـ Cookie (JWT)
    const cookieToken = req.cookies?.token;
    if (cookieToken) {
      try {
        const payload: any = jwt.verify(cookieToken, JWT_SECRET);
        user = await prisma.user.findUnique({ where: { id: payload.userId } });
      } catch {
        console.log("Cookie token invalid");
      }
    }

    // 2. إذا لم يوجد مستخدم، تحقق من التوكن القادم من الواجهة (Supabase Header)
    if (!user) {
      const authHeader = req.headers.authorization;
      console.log("Authorization Header:", authHeader); // <--- سيظهر التوكن في كونسول السيرفر

      if (authHeader?.startsWith('Bearer ')) {
        const accessToken = authHeader.substring(7);
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_ANON_KEY;

          if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(accessToken);

            if (error) {
              console.error("Supabase Error:", error.message); // <--- سيظهر سبب الخطأ هنا
            }

            if (supabaseUser?.id) {
              user = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
              if (!user) {
                console.log("User not found in Prisma with ID:", supabaseUser.id);
              }
            }
          }
        } catch (e) {
          console.error("AuthGuard Exception:", e);
        }
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - No valid user found' });
    }

    (req as any).user = user;
    return next();
  } catch (err) {
    console.error("Critical AuthGuard Error:", err);
    return res.status(401).json({ message: 'Unauthorized - Critical Error' });
  }
}