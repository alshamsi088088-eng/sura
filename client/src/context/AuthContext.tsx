
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import type { UserProfile } from '../types';

function extractFirebaseErrorDetails(err: unknown) {
  const anyErr = err as any;
  return {
    code: anyErr?.code,
    message: anyErr?.message,
    email: anyErr?.customData?.email,
    credential: anyErr?.customData?.credential?.providerId,
    raw: anyErr,
  };
}
import {
  signInWithEmailPassword,
  signOutUser,
  signInWithGoogle,
  signUpWithEmailPassword,
} from '../lib/firebaseAuth';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  googleLogin: async () => {},
});

function mapFirebaseUserToProfile(fbUser: any): UserProfile {
  return {
    id: fbUser.uid,
    email: fbUser.email ?? '',
    name: fbUser.displayName ?? '',
    avatar: fbUser.photoURL ?? undefined,

    // sensible defaults so the app can remain simple and rely on Firebase-only auth
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
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(mapFirebaseUserToProfile(fbUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login: AuthState['login'] = async (email, password) => {
    await signInWithEmailPassword(email, password);
    // onAuthStateChanged will update `user`
  };

  const logout: AuthState['logout'] = async () => {
    await signOutUser();
    // onAuthStateChanged will update `user`
    setUser(null);
  };

  const register: AuthState['register'] = async (name, email, password) => {
    await signUpWithEmailPassword(name, email, password);
    // onAuthStateChanged will update `user`
  };

  const googleLogin: AuthState['googleLogin'] = async () => {
    await signInWithGoogle();
    // onAuthStateChanged will update `user`
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
