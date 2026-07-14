import { supabase } from './supabaseClient';

/**
 * Returns an Authorization header (Bearer <supabase_access_token>) for the
 * current logged-in user, or an empty object if there's no active session.
 *
 * WHY THIS EXISTS:
 * The backend's `authGuard` middleware checks two things, in order:
 *   1. A server-issued cookie named `token` (set by POST /api/auth/login)
 *   2. A Supabase access token via `Authorization: Bearer <token>`
 *
 * Users on this app authenticate via Supabase Auth on the client, so the
 * server-issued `token` cookie is never set for them — every protected
 * request MUST include the Supabase access token as a Bearer header, or
 * authGuard rejects it with 401 regardless of client-side login state.
 *
 * Usage:
 *   const res = await fetch(url, {
 *     credentials: 'include',
 *     headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) }
 *   });
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  } catch {
    return {};
  }
}
