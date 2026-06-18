function assertEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const JWT_SECRET = assertEnv('JWT_SECRET');
export const JWT_REFRESH_SECRET = assertEnv('JWT_REFRESH_SECRET');
export const DATABASE_URL = assertEnv('DATABASE_URL');

export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
export const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

export function validateEnvironment() {
  return {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    DATABASE_URL
  };
}
