import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface ScheduleCandidate {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface ProgressData {
  user_id: string;
  progress_rate: number;
  updated_at: string;
}

interface MemberData {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  users?: {
    display_name?: string;
    avatar_url?: string;
  };
}

interface ScheduleData {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface BookCandidate {
  book_id: number;
  is_selected: boolean;
  books: {
    id: string;
    title: string;
    author: string;
    img_url: string;
  };
}

interface VoteData {
  user_id: string;
}

// 読書会詳細取得
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServerClient();
    const { id } = params;

    // まず基本的な読書会情報を取得
    const { data: bookclub, error } = await supabase
      .from('bookclubs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !bookclub) {
      return NextResponse.json({ error: '読書会が見つかりません' }, { status: 404 });
    }

    // 関連データを個別に取得
    const { data: settings } = await supabase
      .from('bookclub_settings')
      .select('*')
      .eq('bookclub_id', id)
      .single();

    const { data: schedules } = await supabase
      .from('bookclub_schedule_candidates')
      .select('*')
      .eq('bookclub_id', id);

    const { data: members } = await supabase
      .from('bookclub_members')
      .select(
        `
        *,
        users(display_name, avatar_url)
      `
      )
      .eq('bookclub_id', id);

    const { data: progress } = await supabase
      .from('bookclub_progress')
      .select('*')
      .eq('bookclub_id', id);

    const { data: bookCandidates } = await supabase
      .from('bookclub_book_candidates')
      .select(
        `
        *,
        books(*)
      `
      )
      .eq('bookclub_id', id);

    const { data: createdByUser } = await supabase
      .from('users')
      .select('display_name, avatar_url')
      .eq('id', bookclub.created_by)
      .single();

    // 各書籍候補の投票数とユーザーの投票状況を取得
    const bookCandidatesWithVotes = await Promise.all(
      (bookCandidates || []).map(async (candidate: BookCandidate) => {
        // 投票数を取得
        const { data: votes } = await supabase
          .from('bookclub_book_votes')
          .select('user_id')
          .eq('bookclub_id', id)
          .eq('book_id', candidate.book_id);

        // 現在のユーザーの投票状況を取得
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const userVoted = user
          ? votes?.some((vote: VoteData) => vote.user_id === user.id) || false
          : false;

        return {
          ...candidate,
          vote_count: votes?.length || 0,
          user_voted: userVoted,
        };
      })
    );

    // 平均進捗計算
    const avgProgress =
      progress && progress.length > 0
        ? Math.round(
            progress.reduce((sum: number, p: ProgressData) => sum + (p.progress_rate || 0), 0) /
              progress.length
          )
        : 0;

    return NextResponse.json({
      id: bookclub.id,
      title: bookclub.title,
      purpose: bookclub.purpose,
      description: bookclub.description,
      status: bookclub.status,
      invite_url: bookclub.invite_url,
      created_by: bookclub.created_by,
      created_at: bookclub.created_at,
      organizer: {
        id: bookclub.created_by,
        name: createdByUser?.display_name || '不明',
        avatar_url: createdByUser?.avatar_url,
      },
      settings: {
        max_participants: settings?.max_participants || 10,
        is_public: settings?.is_public !== false,
        requires_approval: settings?.requires_approval || false,
        book_candidates: settings?.settings_json?.book_candidates || [],
      },
      book_candidates: bookCandidatesWithVotes,
      schedule_candidates: (schedules || []).map((schedule: ScheduleData) => ({
        id: schedule.id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
      })),
      members: (members || []).map((member: MemberData) => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        name: member.users?.display_name || '不明',
        avatar_url: member.users?.avatar_url,
      })),
      member_count: (members || []).length,
      progress: {
        average: avgProgress,
        individual: (progress || []).map((p: ProgressData) => ({
          user_id: p.user_id,
          progress_rate: p.progress_rate,
          updated_at: p.updated_at,
        })),
      },
    });
  } catch (_error) {
    return NextResponse.json({ error: '読書会の詳細取得に失敗しました' }, { status: 500 });
  }
}

// 読書会更新
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServerClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // 権限チェック（作成者のみ更新可能）
    const { data: bookclub, error: checkError } = await supabase
      .from('bookclubs')
      .select('created_by')
      .eq('id', id)
      .single();

    if (checkError || !bookclub) {
      return NextResponse.json({ error: '読書会が見つかりません' }, { status: 404 });
    }

    if (bookclub.created_by !== user.id) {
      return NextResponse.json({ error: 'この読書会を更新する権限がありません' }, { status: 403 });
    }

    // 基本情報更新
    const updateData: Record<string, unknown> = {};
    if (body.title) updateData.title = body.title;
    if (body.purpose !== undefined) updateData.purpose = body.purpose;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status) updateData.status = body.status;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('bookclubs')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        return NextResponse.json({ error: '読書会の更新に失敗しました' }, { status: 500 });
      }
    }

    // 設定更新
    if (body.settings) {
      const { error: settingsError } = await supabase.from('bookclub_settings').upsert([
        {
          bookclub_id: id,
          max_participants: body.settings.max_participants,
          is_public: body.settings.is_public,
          requires_approval: body.settings.requires_approval,
          settings_json: {
            book_candidates: body.settings.book_candidates || [],
          },
        },
      ]);

      if (settingsError) {
        // Settings update failed, but continue
      }
    }

    // スケジュール更新
    if (body.schedule_candidates) {
      // 既存のスケジュールを削除
      await supabase.from('bookclub_schedule_candidates').delete().eq('bookclub_id', id);

      // 新しいスケジュールを追加
      if (body.schedule_candidates.length > 0) {
        const scheduleInserts = body.schedule_candidates.map((schedule: ScheduleCandidate) => ({
          bookclub_id: id,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
        }));

        const { error: scheduleError } = await supabase
          .from('bookclub_schedule_candidates')
          .insert(scheduleInserts);

        if (scheduleError) {
          // Schedule update failed, but continue
        }
      }
    }

    return NextResponse.json({ message: '読書会が更新されました' });
  } catch (_error) {
    return NextResponse.json({ error: '読書会の更新に失敗しました' }, { status: 500 });
  }
}

// 読書会削除
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServerClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = params;

    // 権限チェック（作成者のみ削除可能）
    const { data: bookclub, error: checkError } = await supabase
      .from('bookclubs')
      .select('created_by')
      .eq('id', id)
      .single();

    if (checkError || !bookclub) {
      return NextResponse.json({ error: '読書会が見つかりません' }, { status: 404 });
    }

    if (bookclub.created_by !== user.id) {
      return NextResponse.json({ error: 'この読書会を削除する権限がありません' }, { status: 403 });
    }

    // 読書会削除（CASCADE により関連データも削除される）
    const { error: deleteError } = await supabase.from('bookclubs').delete().eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: '読書会の削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ message: '読書会が削除されました' });
  } catch (_error) {
    return NextResponse.json({ error: '読書会の削除に失敗しました' }, { status: 500 });
  }
}
