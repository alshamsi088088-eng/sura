import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware for Express.
 *
 * This provides defense-in-depth for API responses. When deployed behind nginx
 * (as in Railway), the nginx.conf also sets these headers — but this ensures
 * they are present even in non-nginx deployments (e.g. local dev, direct API access).
 *
 * NOTE: Content-Security-Policy is set at the nginx layer for the SPA (HTML pages).
 * For API endpoints, a strict CSP is set here to prevent script injection in JSON responses.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Enable XSS filter in legacy browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS — only in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Permissions Policy — restrict browser features
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), autoplay=(self)'
  );

  // Content-Security-Policy for API responses (non-HTML)
  // This is intentionally lenient for API endpoints since they serve JSON.
  // The actual CSP for HTML pages is set in nginx.conf.
  res.setHeader("Content-Security-Policy", "default-src 'none'; base-uri 'none'; form-action 'none'");

  next();
}

