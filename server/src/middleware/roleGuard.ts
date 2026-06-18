
import { Request, Response, NextFunction } from 'express';

function normalizeRole(role?: string) {
  const value = (role || '').toLowerCase();
  if (value === 'admin') return 'admin';
  if (value === 'editor') return 'editor';
  if (value === 'reader' || value === 'member') return 'reader';
  return value;
}

export function roleGuard(allowedRoles: string | string[]) {
  const normalizedAllowed = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map((role) => normalizeRole(role));

  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const userRole = normalizeRole(user?.role);

    if (!user || !normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}
