import { createClient } from '@supabase/supabase-js';

// クライアントサイドでのみ実行されるようにする
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabase: any = null;

// Supabaseクライアントを初期化する関数
const initializeSupabaseClient = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // eslint-disable-next-line no-console
  console.log('Initializing Supabase client:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl.substring(0, 30) + '...',
  });

  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return null;
};

// ブラウザ環境でのみ初期化する
if (typeof window !== 'undefined') {
  supabase = initializeSupabaseClient();
}

// クライアントが初期化されていない場合のフォールバック
export const getSupabaseClient = () => {
  if (typeof window !== 'undefined' && !supabase) {
    // eslint-disable-next-line no-console
    console.log('Supabase client not found, attempting to initialize...');
    supabase = initializeSupabaseClient();
  }

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

  // より確実なドメイン判定
  const currentDomain = window.location.origin;
  let redirectUrl;

  if (currentDomain.includes('dev-libro.vercel.app') || currentDomain.includes('vercel.app')) {
    // 本番環境（Vercel）
    redirectUrl = 'https://dev-libro.vercel.app/auth/callback';
  } else if (currentDomain.includes('localhost')) {
    // 開発環境
    redirectUrl = `${currentDomain}/auth/callback`;
  } else {
    // フォールバック
    redirectUrl = 'https://dev-libro.vercel.app/auth/callback';
  }

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

  // より確実なドメイン判定
  const currentDomain = window.location.origin;
  let redirectUrl;

  // デバッグログを追加
  // eslint-disable-next-line no-console
  console.log('=== Google Sign In Debug ===');
  // eslint-disable-next-line no-console
  console.log('Current domain:', currentDomain);
  // eslint-disable-next-line no-console
  console.log('User agent:', navigator.userAgent);
  // eslint-disable-next-line no-console
  console.log('Location:', window.location.href);

  if (currentDomain.includes('dev-libro.vercel.app') || currentDomain.includes('vercel.app')) {
    // 本番環境（Vercel）
    redirectUrl = 'https://dev-libro.vercel.app/auth/callback';
  } else if (currentDomain.includes('localhost')) {
    // 開発環境
    redirectUrl = `${currentDomain}/auth/callback`;
  } else {
    // フォールバック
    redirectUrl = 'https://dev-libro.vercel.app/auth/callback';
  }

  // eslint-disable-next-line no-console
  console.log('Redirect URL:', redirectUrl);

  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    // eslint-disable-next-line no-console
    console.log('OAuth response:', { data: !!data, error: error?.message });
    // eslint-disable-next-line no-console
    console.log('=== End Google Sign In Debug ===');

    return { data, error };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Google sign in error:', err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data: null, error: err as any };
  }
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
