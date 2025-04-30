import { createClient } from '@supabase/supabase-js';

// クライアントサイドでのみ実行されるようにする
let supabase: ReturnType<typeof createClient> | null = null;

// ブラウザ環境でのみ初期化する
if (typeof window !== 'undefined') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
}

// クライアントが初期化されていない場合のフォールバック
const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(
      'Supabase client not initialized. Make sure you are using this client only on the client side.'
    );
  }
  return supabase;
};

// ユーザー認証関連の関数
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  return { data, error };
};

export const signInWithEmail = async (email: string, password: string) => {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
};

export const signInWithGitHub = async () => {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  return { data, error };
};

export const signInWithGoogle = async () => {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  return { data, error };
};

export const signOut = async () => {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  return { error };
};

export const getSession = async () => {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();
  return { data, error };
};

export const getUser = async () => {
  const client = getSupabaseClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  return { user, error };
};

export { supabase };
