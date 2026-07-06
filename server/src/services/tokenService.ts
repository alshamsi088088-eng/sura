
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_REFRESH_SECRET } from './config.js';

export function createTokenPair(userId: string) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { token, refreshToken };
}

// Use sameSite: 'none' for production (cross-origin cookies for Railway HTTPS proxy)
const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/'
};

export function sendAuthCookies(res: any, { token, refreshToken }: { token: string; refreshToken: string }) {
  res.cookie('token', token, { ...cookieOptions, maxAge: 1000 * 60 * 60 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 30 });
}
