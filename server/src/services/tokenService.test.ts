import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { createTokenPair, sendAuthCookies } from './tokenService.js';
import { JWT_SECRET, JWT_REFRESH_SECRET } from './config.js';

describe('tokenService', () => {
  it('creates valid JWT tokens', () => {
    const { token, refreshToken } = createTokenPair('user-123');

    expect(typeof token).toBe('string');
    expect(typeof refreshToken).toBe('string');

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const refreshPayload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

    expect(payload.userId).toBe('user-123');
    expect(refreshPayload.userId).toBe('user-123');
  });

  it('writes secure cookies for auth tokens', () => {
    const cookieStore: Record<string, any> = {};
    const res = {
      cookie: (name: string, value: string, options: any) => {
        cookieStore[name] = { value, options };
      }
    } as any;

    const tokens = createTokenPair('user-123');
    sendAuthCookies(res, tokens);

    expect(cookieStore.token).toBeDefined();
    expect(cookieStore.refreshToken).toBeDefined();
    expect(cookieStore.token.options.httpOnly).toBe(true);
    expect(cookieStore.refreshToken.options.httpOnly).toBe(true);
    expect(cookieStore.token.options.sameSite).toBe('lax');
    expect(cookieStore.refreshToken.options.sameSite).toBe('lax');
  });
});
