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
export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(
      'Supabase client not initialized. Make sure you are using this client only on the client side.'
    );
  }
  return supabase;
};

// ユーザープロフィールを更新する関数
export const updateUserProfile = async (
  userId: string,
  data: { display_name?: string; experience_years?: number }
) => {
  const client = getSupabaseClient();

  try {
    // まずユーザーが存在するか確認
    const { data: existingUser, error: checkError } = await client
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    // ユーザーが存在しない場合は作成
    if (!existingUser && !checkError) {
      const { error: insertError } = await client.from('users').insert({ id: userId, ...data });

      if (insertError) {
        return { error: insertError };
      }
      return { error: null };
    }

    // 既存ユーザーの更新
    const { error } = await client.from('users').update(data).eq('id', userId);

    return { error };
  } catch (error) {
    return { error };
  }
};

// ユーザープロフィールを取得する関数
export const getUserProfile = async (userId: string) => {
  const client = getSupabaseClient();

  try {
    const { data, error } = await client.from('users').select('*').eq('id', userId).single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
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

  // 本番環境では明示的にVercelのURLを使用し、それ以外の環境ではwindow.location.originを使用
  const redirectUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/auth/callback`
    : `${window.location.origin}/auth/callback`;

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: redirectUrl,
    },
  });

  return { data, error };
};

export const signInWithGoogle = async () => {
  const client = getSupabaseClient();

  // 本番環境では明示的にVercelのURLを使用し、それ以外の環境ではwindow.location.originを使用
  const redirectUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/auth/callback`
    : `${window.location.origin}/auth/callback`;

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
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
