function assertEnv(name: string, fallbackWhenDev?: string) {
  const value = process.env[name];
  if (!value) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev && fallbackWhenDev) return fallbackWhenDev;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const JWT_SECRET = assertEnv('JWT_SECRET', 'dev_jwt_secret');
export const JWT_REFRESH_SECRET = assertEnv('JWT_REFRESH_SECRET', 'dev_jwt_refresh_secret');
export const DATABASE_URL = assertEnv('DATABASE_URL');

// Use HTTPS in production to avoid Mixed Content
export const CLIENT_URL = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? 'https://www.sura-codex.com' : 'http://localhost:5173');
export const SERVER_URL = process.env.SERVER_URL || (process.env.NODE_ENV === 'production' ? 'https://www.sura-codex.com' : 'http://localhost:5000');

// ALLOWED_ORIGINS for CORS - accept both with and without www
const ALLOWED_ORIGINS = [
  'https://www.sura-codex.com',
  'https://sura-codex.com',
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
