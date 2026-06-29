import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

// قراءة رابط السيرفر من Vercel، أو استخدام مسار فارغ للعمل محلياً
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

function mapSupabaseUserToProfile(supabaseUser: any, dbRole?: string): UserProfile {
  const metadata = supabaseUser?.user_metadata ?? {};
  const profileName =
    metadata?.name ??
    metadata?.full_name ??
    metadata?.display_name ??
    '';

  const roleFromMeta = metadata?.role ?? 'member';
  // تعريف كـ string[] لمنع تعارض TypeScript في Vercel
  const validRoles: string[] = ['guest', 'member', 'writer', 'admin'];

  let finalRole: UserProfile['role'] = 'member';
  if (dbRole && validRoles.includes(dbRole)) {
    finalRole = dbRole as UserProfile['role'];
  } else if (validRoles.includes(roleFromMeta)) {
    finalRole = roleFromMeta as UserProfile['role'];
  }

  return {
    id: supabaseUser?.id ?? '',
    email: supabaseUser?.email ?? '',
    name: profileName ?? '',
    avatar: metadata?.avatar ?? undefined,
    role: finalRole,
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
    let isMounted = true;

    const init = async () => {
      if (!supabase) {
        if (!isMounted) return;
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user ?? null;
      const accessToken = data?.session?.access_token ?? null;

      if (!isMounted) return;

      if (currentUser && accessToken) {
        let fetchedUser = null;
        try {
          // إضافة API_URL للتواصل مع Railway
          const res = await fetch(`${API_URL}/api/auth/me`, {
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (res.ok) {
            const responseData = await res.json();
            if (responseData?.user) {
              fetchedUser = responseData.user;
            }
          }
        } catch {
          // Fallback to Supabase metadata if server call fails
        }
        if (fetchedUser) {
          const { role, ...rest } = fetchedUser;
          setUser({
            ...rest,
            role: (role as UserProfile['role']) || 'member',
          } as UserProfile);
        } else {
          setUser(mapSupabaseUserToProfile(currentUser));
        }
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
      if (nextUser && accessToken) {
        let fetchedUser = null;
        try {
          // إضافة API_URL للتواصل مع Railway
          const res = await fetch(`${API_URL}/api/auth/me`, {
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (res.ok) {
            const responseData = await res.json();
            if (responseData?.user) {
              fetchedUser = responseData.user;
            }
          }
        } catch {
          // Fallback
        }
        if (fetchedUser) {
          const { role, ...rest } = fetchedUser;
          setUser({
            ...rest,
            role: (role as UserProfile['role']) || 'member',
          } as UserProfile);
        } else {
          setUser(mapSupabaseUserToProfile(nextUser));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      const maybeInner = (subscription as any)?.subscription;
      if (maybeInner?.unsubscribe) maybeInner.unsubscribe();
      else if ((subscription as any)?.unsubscribe) (subscription as any).unsubscribe();
    };
  }, []);

  const login: AuthState['login'] = async (email, password) => {
    if (!supabase) {
      throw new Error(
        'Supabase client is not initialized. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.'
      );
    }
    const { data: sessionData } = await supabase.auth.signInWithPassword({ email, password });
    const accessToken = sessionData?.session?.access_token ?? null;

    if (accessToken) {
      let userFetched = false;
      try {
        // إضافة API_URL للتواصل مع Railway
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            const { role, ...rest } = data.user;
            setUser({
              ...rest,
              role: (role as UserProfile['role']) || 'member',
            } as UserProfile);
            userFetched = true;
          }
        }
      } catch (err) {
        console.error('Failed to fetch user profile from server:', err);
      }
      if (!userFetched) {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser(accessToken);
        if (supabaseUser) {
          setUser(mapSupabaseUserToProfile(supabaseUser));
        }
      }
    }
  };

  const logout: AuthState['logout'] = async () => {
    if (!supabase) {
      throw new Error(
        'Supabase client is not initialized. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.'
      );
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const register: AuthState['register'] = async (email, password, name) => {
    if (!supabase) {
      return {
        data: null,
        error: new Error(
          'Supabase client is not initialized. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.'
        ),
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { data: null, error: error as Error };
    }

    return { data, error: null };
  };

  const googleLogin: AuthState['googleLogin'] = async () => {
    if (!supabase) {
      throw new Error(
        'Supabase client is not initialized. Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.'
      );
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...stateValue,
        login,
        logout,
        register,
        googleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}