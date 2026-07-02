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
// Use HTTPS in production to avoid Mixed Content - ONLY www domain
export const CLIENT_URL = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://www.sura-codex.com' : 'http://localhost:5173');
export const SERVER_URL = process.env.SERVER_URL || (process.env.NODE_ENV === 'production' ? 'https://www.sura-codex.com' : 'http://localhost:5000');

/**
 * ✅ CORS Origins - PRODUCTION: ONLY www.sura-codex.com
 * This fixes 308 redirect loops by not allowing non-www domain
 *
 * @important - Do NOT add non-www domain (sura-codex.com) as it causes:
 * - 308 permanent redirect loops
 * - Duplicate CORS checks
 * - Railway proxy confusion
 */
// ✅ CHANGED: allow localhost during local testing (including when NODE_ENV=production)
// هذا يمنع رفض Socket.IO origin أثناء الاختبار من 127.0.0.1:5173
const ALLOWED_ORIGINS = [
  'https://www.sura-codex.com',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://localhost:3000'
];
export const ALLOWED_ORIGINS_STR = process.env.ALLOWED_ORIGINS?.split(',') || ALLOWED_ORIGINS;


export function validateEnvironment() {
  return {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    DATABASE_URL
  };
}