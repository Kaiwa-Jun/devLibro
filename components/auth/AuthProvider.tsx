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
      setLoading(false);
      return;
    }

    // 初期セッションと認証状態の変更を監視
    const fetchUser = async () => {
      try {
        // supabaseがnullでないことがわかっている
        const client = supabase as ReturnType<typeof createClient>;
        const { data } = await client.auth.getSession();

        // デバッグ用：ユーザー情報をコンソールに表示
        if (data.session?.user) {
          console.log('User data:', data.session.user);
        }

        setUser(data.session?.user || null);
      } catch (error) {
        console.error('セッション取得エラー:', error);
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
      // デバッグ用：認証イベントとユーザー情報をコンソールに表示
      console.log('Auth event:', event, session?.user);

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
