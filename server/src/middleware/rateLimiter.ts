import type { Request, Response, NextFunction } from 'express';

type RateKey = string;

type RateState = {
  tokens: number;
  lastRefill: number;
};

const rateMap = new Map<RateKey, RateState>();

export function rateLimiter(maxRequests: number, windowSeconds: number) {
  const refillAmount = maxRequests;
  const windowMs = windowSeconds * 1000;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const now = Date.now();
    const state = rateMap.get(key) ?? { tokens: maxRequests, lastRefill: now };

    const elapsed = now - state.lastRefill;
    if (elapsed > windowMs) {
      state.tokens = refillAmount;
      state.lastRefill = now;
    }

    if (state.tokens <= 0) {
      res.status(429).json({ message: 'Too many requests, please try again later' });
      return;
    }

    state.tokens -= 1;
    rateMap.set(key, state);

    next();
  };
}
