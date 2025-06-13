import { NextRequest, NextResponse } from 'next/server';

import { createApiRouteSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export interface CreateReadingCircleRequest {
  title: string;
  purpose?: string;
  description?: string;
  book_candidates?: number[];
  schedule_candidates?: ScheduleCandidate[];
  max_participants?: number;
  is_public?: boolean;
  requires_approval?: boolean;
}

export interface ScheduleCandidate {
  day_of_week: number; // 0-6 (0: Sunday, 6: Saturday)
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
}

export interface ReadingCircleResponse {
  id: string;
  title: string;
  purpose?: string;
  description?: string;
  status: string;
  invite_url: string;
  created_by: string;
  created_at: string;
  member_count: number;
  max_participants: number;
  book_candidates?: number[];
  schedule_candidates?: ScheduleCandidate[];
}

// 読書会作成API
export async function POST(request: NextRequest) {
  try {
    const supabase = createApiRouteSupabaseClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body: CreateReadingCircleRequest = await request.json();

    // バリデーション
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json({ error: 'タイトルは必須です' }, { status: 400 });
    }

    if (body.title.length > 100) {
      return NextResponse.json(
        { error: 'タイトルは100文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (body.description && body.description.length > 1000) {
      return NextResponse.json({ error: '説明は1000文字以内で入力してください' }, { status: 400 });
    }

    // スケジュール候補のバリデーション
    if (body.schedule_candidates) {
      for (const schedule of body.schedule_candidates) {
        if (schedule.day_of_week < 0 || schedule.day_of_week > 6) {
          return NextResponse.json({ error: '無効な曜日が指定されています' }, { status: 400 });
        }

        // 時間形式の検証 (HH:MM)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(schedule.start_time) || !timeRegex.test(schedule.end_time)) {
          return NextResponse.json(
            { error: '時間は HH:MM 形式で入力してください' },
            { status: 400 }
          );
        }

        // 開始時間が終了時間より前であることを確認
        if (schedule.start_time >= schedule.end_time) {
          return NextResponse.json(
            { error: '開始時間は終了時間より前である必要があります' },
            { status: 400 }
          );
        }
      }
    }

    // 招待URLを生成
    const inviteCode = generateInviteCode();
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reading-circles/join/${inviteCode}`;

    // トランザクション開始
    const { data: bookclub, error: createError } = await supabase
      .from('bookclubs')
      .insert([
        {
          title: body.title.trim(),
          purpose: body.purpose?.trim(),
          description: body.description?.trim(),
          status: 'recruiting',
          invite_url: inviteUrl,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating bookclub:', createError);
      return NextResponse.json({ error: '読書会の作成に失敗しました' }, { status: 500 });
    }

    // 作成者をメンバーとして追加
    const { error: memberError } = await supabase.from('bookclub_members').insert([
      {
        bookclub_id: bookclub.id,
        user_id: user.id,
        role: 'organizer',
      },
    ]);

    if (memberError) {
      console.error('Error adding organizer as member:', memberError);
      // 読書会を削除してロールバック
      await supabase.from('bookclubs').delete().eq('id', bookclub.id);
      return NextResponse.json({ error: 'メンバー追加に失敗しました' }, { status: 500 });
    }

    // 読書会設定を追加
    const { error: settingsError } = await supabase.from('bookclub_settings').insert([
      {
        bookclub_id: bookclub.id,
        max_participants: body.max_participants || 10,
        is_public: body.is_public !== false,
        requires_approval: body.requires_approval || false,
        settings_json: {
          book_candidates: body.book_candidates || [],
        },
      },
    ]);

    if (settingsError) {
      console.error('Error creating bookclub settings:', settingsError);
      // ロールバック処理は省略（実際の本番環境では適切な処理を追加）
    }

    // スケジュール候補を追加
    if (body.schedule_candidates && body.schedule_candidates.length > 0) {
      const scheduleInserts = body.schedule_candidates.map(schedule => ({
        bookclub_id: bookclub.id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
      }));

      const { error: scheduleError } = await supabase
        .from('bookclub_schedule_candidates')
        .insert(scheduleInserts);

      if (scheduleError) {
        console.error('Error adding schedule candidates:', scheduleError);
        // ロールバック処理は省略
      }
    }

    // レスポンス用データを準備
    const response: ReadingCircleResponse = {
      id: bookclub.id,
      title: bookclub.title,
      purpose: bookclub.purpose,
      description: bookclub.description,
      status: bookclub.status,
      invite_url: bookclub.invite_url,
      created_by: bookclub.created_by,
      created_at: bookclub.created_at,
      member_count: 1,
      max_participants: body.max_participants || 10,
      book_candidates: body.book_candidates,
      schedule_candidates: body.schedule_candidates,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Reading circle creation error:', error);
    return NextResponse.json({ error: '読書会の作成に失敗しました' }, { status: 500 });
  }
}

// 読書会一覧取得API
export async function GET(request: NextRequest) {
  try {
    const supabase = createApiRouteSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase.from('bookclubs').select(`
      *,
      bookclub_members(count),
      bookclub_settings(max_participants, is_public),
      bookclub_schedule_candidates(*)
    `);

    // ステータスフィルター
    if (status && ['recruiting', 'in-progress', 'completed'].includes(status)) {
      query = query.eq('status', status);
    }

    // 公開設定フィルター（ユーザーIDが指定されていない場合は公開のみ）
    if (!userId) {
      query = query.eq('bookclub_settings.is_public', true);
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: bookclubs, error } = await query;

    if (error) {
      console.error('Error fetching bookclubs:', error);
      return NextResponse.json({ error: '読書会の取得に失敗しました' }, { status: 500 });
    }

    const formattedBookclubs =
      bookclubs?.map(bookclub => ({
        id: bookclub.id,
        title: bookclub.title,
        purpose: bookclub.purpose,
        description: bookclub.description,
        status: bookclub.status,
        invite_url: bookclub.invite_url,
        created_by: bookclub.created_by,
        created_at: bookclub.created_at,
        member_count: Array.isArray(bookclub.bookclub_members)
          ? bookclub.bookclub_members.length
          : 0,
        max_participants: bookclub.bookclub_settings?.[0]?.max_participants || 10,
        is_public: bookclub.bookclub_settings?.[0]?.is_public || true,
        schedule_candidates: bookclub.bookclub_schedule_candidates || [],
      })) || [];

    return NextResponse.json({ bookclubs: formattedBookclubs });
  } catch (error) {
    console.error('Reading circles fetch error:', error);
    return NextResponse.json({ error: '読書会の取得に失敗しました' }, { status: 500 });
  }
}

// 招待コード生成関数
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
