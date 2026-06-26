
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('Server error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
}
