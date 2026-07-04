import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || '';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{
    data: any | null;
    error: Error | null;
  }>;
  googleLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
  register: async () => ({ data: null, error: null }),
  googleLogin: async () => {},
});

function mapSupabaseUserToProfile(supabaseUser: any): UserProfile {
  const metadata = supabaseUser?.user_metadata ?? {};
  const profileName =
    metadata?.name ??
    metadata?.full_name ??
    metadata?.display_name ??
    '';

  // IMPORTANT: default role should NOT force 'member' when API role fetching fails.
  // We keep it as 'member' only as a last-resort fallback.
  // Real role should come from /api/auth/me.
  const role = 'member';

  return {
    id: String(supabaseUser?.id ?? ''),
    email: String(supabaseUser?.email ?? ''),
    name: profileName ?? '',
    avatar: metadata?.avatar ?? undefined,
    role,
    locale: 'en',
    theme: 'light',
  } as UserProfile;
}

async function fetchMe(accessToken: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) return null;

    const body = await res.json();
    return (body?.user as UserProfile) ?? null;
  } catch {
    return null;
  }
}

function readRoleFromAny(obj: any): UserProfile['role'] | null {
  const raw = obj?.user_metadata?.role ?? obj?.role ?? obj?.user_role ?? null;
  if (!raw || typeof raw !== 'string') return null;
  const normalized = raw.toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'editor') return 'editor' as any;
  if (normalized === 'member') return 'member';
  if (normalized === 'writer') return 'writer' as any;
  return null;
}

async function fetchRoleFromSupabaseMetadata(accessToken: string): Promise<UserProfile['role'] | null> {
  try {
    // Try to decode role from /api/auth/profile payload if present
    // But since we can't rely on that, use the existing Supabase session/user.
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!supabaseUrl || !supabaseAnonKey) return null;

    const sb = createClient(supabaseUrl, supabaseAnonKey);
    const { data: supa } = await sb.auth.getUser(accessToken);
    if (!supa?.user) return null;

    return readRoleFromAny(supa.user);
  } catch {
    return null;
  }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const stateValue = useMemo(
    () => ({
      user,
      loading,
    }),
    [user, loading]
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!supabase) {
        if (!mounted) return;
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user ?? null;
      const accessToken = data?.session?.access_token ?? null;

      if (!mounted) return;

      if (!currentUser || !accessToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Prefer server-derived role
      const me = await fetchMe(accessToken);
      if (me) {
        // If server returned a valid role, trust it.
        if (me.role === 'admin' || me.role === 'member' || me.role === 'editor' || me.role === 'writer') {
          setUser(me);
          setLoading(false);
          return;
        }

        // Server returned something but not a recognized role; fall through to metadata.
      }

      // Fallback: Supabase metadata / user payload role
      const { data: supaData } = await supabase.auth.getUser(accessToken);
      if (!mounted) return;

      if (supaData?.user) {
        const roleFromMeta = await fetchRoleFromSupabaseMetadata(accessToken);
        const profile = mapSupabaseUserToProfile(supaData.user);
        setUser({
          ...profile,
          role: roleFromMeta ?? profile.role,
        });
      } else {
        setUser(null);
      }


      setLoading(false);
    };

    init();

    if (!supabase) return;

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      const accessToken = session?.access_token ?? null;

      if (!mounted) return;

      if (!nextUser || !accessToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const me = await fetchMe(accessToken);
      if (me) {
        setUser(me);
        setLoading(false);
        return;
      }

      // Fallback
      const { data: supaData } = await supabase.auth.getUser(accessToken);
      if (supaData?.user) {
        setUser(mapSupabaseUserToProfile(supaData.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      const maybeInner = (subscription as any)?.subscription;
      if (maybeInner?.unsubscribe) maybeInner.unsubscribe();
      else if ((subscription as any)?.unsubscribe) (subscription as any).unsubscribe();
    };
  }, []);

  const login: AuthState['login'] = async (email, password) => {
    if (!supabase) throw new Error('Supabase client is not initialized.');

    const { data: sessionData } = await supabase.auth.signInWithPassword({ email, password });
    const accessToken = sessionData?.session?.access_token ?? null;

    if (!accessToken) return;

    // Prefer server-derived role immediately after login
    const me = await fetchMe(accessToken);
    if (me) {
      setUser(me);
      return;
    }

    // Fallback
    const { data: supaData } = await supabase.auth.getUser(accessToken);
    if (supaData?.user) {
      setUser(mapSupabaseUserToProfile(supaData.user));
    }
  };

  const logout: AuthState['logout'] = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  const register: AuthState['register'] = async (email, password, name) => {
    if (!supabase) return { data: null, error: new Error('Supabase not init') };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { data, error: error as Error };
  };

  const googleLogin: AuthState['googleLogin'] = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <AuthContext.Provider value={{ ...stateValue, login, logout, register, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

