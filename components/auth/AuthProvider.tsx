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
      console.log('🔒 [AuthProvider] スキップ - ブラウザ環境でないかSupabaseが利用できません');
      setLoading(false);
      return;
    }

    console.log('🚀 [AuthProvider] 初期化開始');
    console.log('🌐 [AuthProvider] 現在のURL:', window.location.href);
    console.log('🔧 [AuthProvider] Supabaseクライアント:', !!supabase);

    // 初期セッションと認証状態の変更を監視
    const fetchUser = async () => {
      try {
        console.log('🔍 [AuthProvider] 初期セッション取得開始');
        const client = supabase as ReturnType<typeof createClient>;
        const { data, error } = await client.auth.getSession();

        console.log('🔍 [AuthProvider] 初期セッション結果:', {
          hasSession: !!data.session,
          hasUser: !!data.session?.user,
          error: error?.message,
          userId: data.session?.user?.id,
          userEmail: data.session?.user?.email,
          userMetadata: data.session?.user?.user_metadata,
          accessToken: data.session?.access_token ? 'あり' : 'なし',
          refreshToken: data.session?.refresh_token ? 'あり' : 'なし',
          expiresAt: data.session?.expires_at,
          tokenType: data.session?.token_type,
        });

        // ローカルストレージの状態も確認
        console.log('💾 [AuthProvider] ローカルストレージ確認:', {
          supabaseAuth: localStorage.getItem('sb-sjjpfsgijztcoxuqrhbs-auth-token')
            ? 'あり'
            : 'なし',
          allKeys: Object.keys(localStorage).filter(
            key => key.includes('supabase') || key.includes('auth')
          ),
        });

        const currentUser = data.session?.user || null;
        console.log('👤 [AuthProvider] ユーザー設定:', {
          previousUser: user?.id,
          newUser: currentUser?.id,
          isUserChange: user?.id !== currentUser?.id,
        });

        setUser(currentUser);
      } catch (error) {
        console.error('❌ [AuthProvider] 初期セッション取得エラー:', error);
      } finally {
        console.log('🏁 [AuthProvider] 初期化完了');
        setLoading(false);
      }
    };

    fetchUser();

    // 認証状態の変更を監視
    const client = supabase as ReturnType<typeof createClient>;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      console.log('🔄 [AuthProvider] 認証状態変更:', {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        previousUserId: user?.id,
        isUserChange: user?.id !== session?.user?.id,
        timestamp: new Date().toISOString(),
      });

      // セッション詳細情報
      if (session) {
        console.log('🔍 [AuthProvider] セッション詳細:', {
          accessToken: session.access_token ? 'あり' : 'なし',
          refreshToken: session.refresh_token ? 'あり' : 'なし',
          expiresAt: session.expires_at,
          tokenType: session.token_type,
          providerToken: session.provider_token ? 'あり' : 'なし',
          providerRefreshToken: session.provider_refresh_token ? 'あり' : 'なし',
        });

        // トークンの詳細情報をデコード
        if (session.access_token) {
          try {
            const tokenParts = session.access_token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('🔓 [AuthProvider] トークンペイロード:', {
                sub: payload.sub,
                email: payload.email,
                aud: payload.aud,
                exp: payload.exp,
                iat: payload.iat,
                iss: payload.iss,
                role: payload.role,
                session_id: payload.session_id,
                現在時刻: Math.floor(Date.now() / 1000),
                有効期限: payload.exp,
                期限切れ: payload.exp < Math.floor(Date.now() / 1000),
              });
            }
          } catch (tokenError) {
            console.error('❌ [AuthProvider] トークンデコードエラー:', tokenError);
          }
        }
      }

      const newUser = session?.user || null;
      console.log('👤 [AuthProvider] ユーザー更新:', {
        from: user?.id,
        to: newUser?.id,
        isChange: user?.id !== newUser?.id,
      });

      setUser(newUser);
      setLoading(false);
    });

    return () => {
      console.log('🧹 [AuthProvider] クリーンアップ');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('🚪 [AuthProvider] サインアウト開始');
    if (!supabase) {
      console.log('❌ [AuthProvider] Supabaseクライアントが利用できません');
      return;
    }

    try {
      const result = await supabase.auth.signOut();
      console.log('✅ [AuthProvider] サインアウト完了:', result);
    } catch (error) {
      console.error('❌ [AuthProvider] サインアウトエラー:', error);
    }
  };

  // 現在の状態をログ出力
  console.log('📊 [AuthProvider] 現在の状態:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    loading,
    timestamp: new Date().toISOString(),
  });

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}
