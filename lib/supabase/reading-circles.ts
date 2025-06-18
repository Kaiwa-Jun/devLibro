import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface ReadingCircle {
  id: string;
  title: string;
  purpose?: string;
  description?: string;
  book_id?: number;
  status: 'recruiting' | 'in-progress' | 'completed';
  invite_url?: string;
  created_by?: string;
  created_at: string;
  member_count?: number;
  max_participants?: number;
  progress?: number;
  schedule_candidates?: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

export interface ReadingCircleMember {
  id: string;
  bookclub_id: string;
  user_id?: string;
  role: string;
  joined_at: string;
}

export interface ReadingCircleProgress {
  id: string;
  bookclub_id: string;
  user_id?: string;
  progress_rate: number;
  updated_at: string;
}

// 輪読会一覧を取得
export async function getReadingCircles(): Promise<ReadingCircle[]> {
  // 環境変数が設定されていない場合は空配列を返す
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured');
    return [];
  }

  try {
    const { data: circles, error } = await supabase.from('bookclubs').select(`
        *,
        bookclub_members(*),
        bookclub_progress(*),
        bookclub_schedule_candidates(*)
      `);

    if (error) {
      console.error('Error fetching reading circles:', error);
      throw error;
    }

    // データを整形
    const formattedCircles: ReadingCircle[] =
      circles?.map(circle => {
        // より現実的な進捗データを設定
        let progress = 0;

        // データベースから進捗データを取得を試行
        if (Array.isArray(circle.bookclub_progress) && circle.bookclub_progress.length > 0) {
          const totalProgress = circle.bookclub_progress.reduce(
            (sum: number, p: { progress_rate?: number }) => sum + (p.progress_rate || 0),
            0
          );
          progress = Math.round(totalProgress / circle.bookclub_progress.length);
        } else {
          // データベースに進捗データがない場合、ステータスとタイトルに基づいてダミーデータを設定
          switch (circle.status) {
            case 'recruiting':
              progress = 0;
              break;
            case 'in-progress':
              // タイトルに基づいて異なる進捗を設定
              if (circle.title.includes('React')) {
                progress = 75;
              } else if (circle.title.includes('TypeScript')) {
                progress = 45;
              } else if (circle.title.includes('Node.js')) {
                progress = 30;
              } else {
                progress = 50;
              }
              break;
            case 'completed':
              progress = 100;
              break;
            default:
              progress = 0;
          }
        }

        return {
          id: circle.id,
          title: circle.title,
          purpose: circle.purpose,
          description: circle.description,
          book_id: circle.book_id,
          status: circle.status as 'recruiting' | 'in-progress' | 'completed',
          invite_url: circle.invite_url,
          created_by: circle.created_by,
          created_at: circle.created_at,
          member_count: Array.isArray(circle.bookclub_members) ? circle.bookclub_members.length : 1,
          max_participants: 10, // デフォルト値
          progress,
          schedule_candidates: circle.bookclub_schedule_candidates || [],
        };
      }) || [];

    return formattedCircles;
  } catch (error) {
    console.error('Error in getReadingCircles:', error);
    throw error;
  }
}

// 特定の輪読会の詳細を取得
export async function getReadingCircleById(id: string): Promise<ReadingCircle | null> {
  // 環境変数が設定されていない場合はnullを返す
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured');
    return null;
  }

  try {
    const { data: circle, error } = await supabase
      .from('bookclubs')
      .select(
        `
        *,
        bookclub_members(count),
        bookclub_progress(progress_rate)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching reading circle:', error);
      throw error;
    }

    if (!circle) return null;

    const formattedCircle: ReadingCircle = {
      id: circle.id,
      title: circle.title,
      purpose: circle.purpose,
      description: circle.description,
      book_id: circle.book_id,
      status: circle.status as 'recruiting' | 'in-progress' | 'completed',
      invite_url: circle.invite_url,
      created_by: circle.created_by,
      created_at: circle.created_at,
      member_count: Array.isArray(circle.bookclub_members) ? circle.bookclub_members.length : 1,
      max_participants: 10, // デフォルト値
      progress:
        Array.isArray(circle.bookclub_progress) && circle.bookclub_progress.length > 0
          ? circle.bookclub_progress[0].progress_rate
          : 0,
    };

    return formattedCircle;
  } catch (error) {
    console.error('Error in getReadingCircleById:', error);
    throw error;
  }
}

// ユーザーが参加している輪読会を取得
export async function getUserReadingCircles(userId: string): Promise<ReadingCircle[]> {
  // 環境変数が設定されていない場合は空配列を返す
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured');
    return [];
  }

  try {
    const { data: membershipData, error } = await supabase
      .from('bookclub_members')
      .select(
        `
        bookclub_id,
        bookclubs (
          *,
          bookclub_members(count),
          bookclub_progress(progress_rate)
        )
      `
      )
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user reading circles:', error);
      throw error;
    }

    // データを整形
    const formattedCircles: ReadingCircle[] =
      membershipData?.map(membership => {
        const circle = membership.bookclubs as unknown as {
          id: string;
          title: string;
          purpose?: string;
          description?: string;
          book_id?: number;
          status: string;
          invite_url?: string;
          created_by?: string;
          created_at: string;
          bookclub_members?: { id: string }[];
          bookclub_progress?: { progress_rate?: number }[];
        };
        return {
          id: circle.id,
          title: circle.title,
          purpose: circle.purpose,
          description: circle.description,
          book_id: circle.book_id,
          status: circle.status as 'recruiting' | 'in-progress' | 'completed',
          invite_url: circle.invite_url,
          created_by: circle.created_by,
          created_at: circle.created_at,
          member_count: Array.isArray(circle.bookclub_members) ? circle.bookclub_members.length : 1,
          max_participants: 10, // デフォルト値
          progress:
            Array.isArray(circle.bookclub_progress) && circle.bookclub_progress.length > 0
              ? circle.bookclub_progress[0].progress_rate
              : 0,
        };
      }) || [];

    return formattedCircles;
  } catch (error) {
    console.error('Error in getUserReadingCircles:', error);
    throw error;
  }
}

// 輪読会を作成
export async function createReadingCircle(data: {
  title: string;
  purpose?: string;
  description?: string;
  book_id?: number;
  created_by: string;
}): Promise<ReadingCircle> {
  // 環境変数が設定されていない場合はエラーを投げる
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables not configured');
  }

  try {
    const { data: circle, error } = await supabase
      .from('bookclubs')
      .insert([
        {
          title: data.title,
          purpose: data.purpose,
          description: data.description,
          book_id: data.book_id,
          status: 'recruiting',
          created_by: data.created_by,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating reading circle:', error);
      throw error;
    }

    // 作成者をメンバーとして追加
    await supabase.from('bookclub_members').insert([
      {
        bookclub_id: circle.id,
        user_id: data.created_by,
        role: 'organizer',
      },
    ]);

    // 作成者の進捗を初期化
    await supabase.from('bookclub_progress').insert([
      {
        bookclub_id: circle.id,
        user_id: data.created_by,
        progress_rate: 0,
      },
    ]);

    return {
      id: circle.id,
      title: circle.title,
      purpose: circle.purpose,
      description: circle.description,
      book_id: circle.book_id,
      status: circle.status as 'recruiting' | 'in-progress' | 'completed',
      invite_url: circle.invite_url,
      created_by: circle.created_by,
      created_at: circle.created_at,
      member_count: 1,
      max_participants: 10,
      progress: 0,
    };
  } catch (error) {
    console.error('Error in createReadingCircle:', error);
    throw error;
  }
}
