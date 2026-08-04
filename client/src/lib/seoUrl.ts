/**
 * Centralized production base URL for canonical URLs, Open Graph, Twitter,
 * and JSON-LD structured data.
 *
 * The canonical production base URL is https://sura-codex.com. We never use
 * localhost or relative URLs in production metadata. During local development
 * (VITE_PUBLIC_BASE_URL unset and running on localhost) we fall back to the
 * current origin so the site still works locally without hardcoding prod URLs.
 */
const PRODUCTION_BASE_URL = 'https://sura-codex.com';

function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/**
 * Returns the absolute base URL for the current environment.
 * - Production builds fall back to https://sura-codex.com
 * - Local dev uses window.location.origin
 */
export function getBaseUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  if (isLocalHost() && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return PRODUCTION_BASE_URL;
}

/**
 * Builds an absolute canonical URL for a given path.
 * @param path e.g. "/about", "/articles/my-slug"
 */
export function canonicalUrl(path: string = '/'): string {
  const base = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
