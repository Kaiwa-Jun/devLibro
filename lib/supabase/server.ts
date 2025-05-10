import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// サーバーコンポーネント用のSupabaseクライアント
export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
};

// サーバーサイドでセッションを取得する関数
export const getServerSession = async () => {
  const supabase = createServerSupabaseClient();
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error getting session:', error);
    return { data: null, error };
  }
};

// サーバーサイドでユーザーを取得する関数
export const getServerUser = async () => {
  const supabase = createServerSupabaseClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return { user: null, error };
    }
    return { user, error: null };
  } catch (error) {
    console.error('Unexpected error getting user:', error);
    return { user: null, error };
  }
};
