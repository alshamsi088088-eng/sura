
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

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

  return {
    id: supabaseUser?.id ?? '',
    email: supabaseUser?.email ?? '',
    name: profileName ?? '',
    avatar: metadata?.avatar ?? undefined,

    role: 'member',
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
      // Avoid crashing the whole app when env vars are missing
      if (!supabase) {
        if (!isMounted) return;
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user ?? null;

      if (!isMounted) return;

      if (currentUser) setUser(mapSupabaseUserToProfile(currentUser));
      else setUser(null);

      setLoading(false);
    };

    init();

    if (!supabase) return;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser ? mapSupabaseUserToProfile(nextUser) : null);
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
    await supabase.auth.signInWithPassword({ email, password });
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
        // ensure user returns to app after verification email flow
        emailRedirectTo: window.location.origin,
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

    // Supabase OAuth usually redirects.
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
