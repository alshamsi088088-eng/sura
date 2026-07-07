import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  // Default role fallback (only when profile lookup fails).
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

function normalizeRole(raw: unknown): UserProfile['role'] | null {
  if (!raw) return null;
  if (typeof raw !== 'string') return null;
  const normalized = raw.toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'editor') return 'editor';
  if (normalized === 'member') return 'member';
  if (normalized === 'writer') return 'writer';
  // handle possible DB variants
  if (normalized === 'superadmin') return 'admin';
  return null;
}

async function fetchUserFromPublicUserTable(userId: string) {
  // Expects `public.User` table with at least: id, name, role
  const sb = supabase;
  if (!sb) return null;

  const { data, error } = await sb
    .from('User')
    .select('id, name, email, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) return null;
  return data as any | null;
}

async function fetchRoleAndProfile(): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const currentUser = sessionData?.session?.user;
  if (!currentUser) return null;

  const sbProfile = await fetchUserFromPublicUserTable(String(currentUser.id));

  const metadata = currentUser?.user_metadata ?? {};
  const profileName =
    sbProfile?.name ??
    metadata?.name ??
    metadata?.full_name ??
    metadata?.display_name ??
    '';

  const role = normalizeRole(sbProfile?.role) ?? 'member';

  return {
    id: String(currentUser.id),
    email: String(sbProfile?.email ?? currentUser.email ?? ''),
    name: profileName,
    avatar: sbProfile?.avatar ?? metadata?.avatar ?? undefined,
    role,
    locale: 'en',
    theme: 'light',
  } as UserProfile;
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

      const profile = await fetchRoleAndProfile();
      if (!mounted) return;
      setUser(profile);
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

      const profile = await fetchRoleAndProfile();
      if (!mounted) return;

      setUser(profile);
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

    const profile = await fetchRoleAndProfile();
    setUser(profile);

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

