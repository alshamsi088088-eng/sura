import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const hasEnv = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasEnv) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase environment variables are missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

export const supabase = hasEnv ? createClient(supabaseUrl!, supabaseAnonKey!) : null;

/**
 * Helper for callers that prefer to fail fast with a clear error.
 * If you use it, wrap usage with try/catch or avoid calling it during render.
 */
export function getSupabaseOrThrow() {
  if (!supabase) {
    throw new Error(
      'Supabase client is not initialized. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.'
    );
  }
  return supabase;
}
