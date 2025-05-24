'use client';

import { createClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase/client';

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  children: React.ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window === 'undefined' || !supabase) {
      // eslint-disable-next-line no-console
      console.log('AuthProvider: Skipping - not in browser or supabase not available');
      setLoading(false);
      return;
    }

    // eslint-disable-next-line no-console
    console.log('=== AuthProvider Init Debug ===');
    // eslint-disable-next-line no-console
    console.log('Window location:', window.location.href);
    // eslint-disable-next-line no-console
    console.log('Supabase client available:', !!supabase);

    // 初期セッションと認証状態の変更を監視
    const fetchUser = async () => {
      try {
        // supabaseがnullでないことがわかっている
        const client = supabase as ReturnType<typeof createClient>;
        const { data, error } = await client.auth.getSession();

        // eslint-disable-next-line no-console
        console.log('Initial session check:', {
          hasSession: !!data.session,
          hasUser: !!data.session?.user,
          error: error?.message,
        });

        setUser(data.session?.user || null);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Initial session fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // 認証状態の変更を監視
    const client = supabase as ReturnType<typeof createClient>;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      // eslint-disable-next-line no-console
      console.log('Auth state change:', {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
      });
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}
