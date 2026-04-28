import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase/client';

type AuthUser = {
  id: string;
  email: string | null;
};

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null; // Supabase access token (JWT)
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session) return setState(s => ({ ...s, isLoading: false }));

        setState({
          user: { id: session.user.id, email: session.user.email ?? null },
          accessToken: session.access_token,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch {
        setState(s => ({ ...s, isLoading: false }));
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
        return;
      }
      setState({
        user: { id: session.user.id, email: session.user.email ?? null },
        accessToken: session.access_token,
        isLoading: false,
        isAuthenticated: true,
      });
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // Note: if email confirmations are enabled, session may be null until confirmed.
  }, []);

  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
