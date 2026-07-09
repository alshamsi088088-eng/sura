function assertEnv(name: string, fallbackWhenDev?: string) {
  const value = process.env[name];
  if (!value) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev && fallbackWhenDev) return fallbackWhenDev;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getDatabaseUrl() {
  // Try SUPABASE_DB_URL first (Railway won't override this var)
  const supabaseDbUrl = process.env.SUPABASE_DB_URL;
  if (supabaseDbUrl) return supabaseDbUrl;

  // Fallback to DATABASE_URL (may be overridden by Railway)
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) return 'postgresql://postgres:postgres@localhost:5432/sura';
    throw new Error('Missing required environment variable: SUPABASE_DB_URL or DATABASE_URL');
  }
  return databaseUrl;
}

export const JWT_SECRET = assertEnv('JWT_SECRET', 'dev_jwt_secret');
export const JWT_REFRESH_SECRET = assertEnv('JWT_REFRESH_SECRET', 'dev_jwt_refresh_secret');
export const DATABASE_URL = getDatabaseUrl();
// Use HTTPS in production to avoid Mixed Content - non-www only (www causes 308 redirect loops)
export const CLIENT_URL = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://sura-codex.com' : 'http://localhost:5173');
export const SERVER_URL = process.env.SERVER_URL || (process.env.NODE_ENV === 'production' ? 'https://api.sura-codex.com' : 'http://localhost:5000');

/**
 * ✅ CORS Origins
 *
 * Primary:   https://sura-codex.com  (canonical production domain)
 * Fallback:  https://www.sura-codex.com — included because a browser that
 *            follows a www → non-www redirect may still send the original
 *            www origin in the Socket.IO handshake header.
 *
 * Note: Railway's HTTP redirect (www → non-www) fires at the HTTP layer.
 * WebSocket upgrades bypass that redirect, so the www origin can arrive
 * at the Socket.IO CORS callback without ever being redirected.
 * Allowing it here prevents a spurious 400 rejection in that case.
 *
 * Localhost origins are included for local and Railway-internal testing.
 */
const ALLOWED_ORIGINS = [
  'https://sura-codex.com',
  'https://www.sura-codex.com', // fallback: browser may send www origin after redirect
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://api.sura-codex.com'
];
export const ALLOWED_ORIGINS_STR = process.env.ALLOWED_ORIGINS?.split(',') || ALLOWED_ORIGINS;


export function validateEnvironment() {
  return {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    DATABASE_URL
  };
}