'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/services/client';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authRequired: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REQUIRE_AUTH_ENV =
  process.env.NEXT_PUBLIC_REQUIRE_SUPABASE_AUTH === 'true';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(isSupabaseConfigured));
  const [rlsPrompted, setRlsPrompted] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;
    let isMounted = true;

    async function initAuth() {
      await Promise.resolve();
      if (!isMounted || !supabase) return;
      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(data.session ?? null);
          if (!data.session && REQUIRE_AUTH_ENV) {
            setIsAuthModalOpen(true);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void initAuth();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      if (nextSession) {
        setRlsPrompted(false);
        setIsAuthModalOpen(false);
      }
    });

    const handleAuthRequired = () => {
      if (!isMounted) return;
      setRlsPrompted(true);
    };

    window.addEventListener('mafrend:auth-required', handleAuthRequired);

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
      window.removeEventListener('mafrend:auth-required', handleAuthRequired);
    };
  }, []);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      if (!supabase) {
        return { error: 'Supabase belum dikonfigurasi.' };
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        return { error: error.message || 'Email atau kata sandi tidak sesuai.' };
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mafrend:auth-changed'));
      }
      return {};
    },
    []
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mafrend:auth-changed'));
    }
  }, []);

  const user = session?.user ?? null;
  const authRequired =
    Boolean(isSupabaseConfigured) && !user && (REQUIRE_AUTH_ENV || rlsPrompted);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      authRequired,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      signInWithPassword,
      signOut,
    }),
    [
      user,
      session,
      loading,
      authRequired,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      signInWithPassword,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
