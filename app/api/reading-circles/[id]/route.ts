import { NextRequest, NextResponse } from 'next/server';

import { createApiRouteSupabaseClient } from '@/lib/supabase/server';

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

// 読書会詳細取得
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createApiRouteSupabaseClient();
    const { id } = params;

    const { data: bookclub, error } = await supabase
      .from('bookclubs')
      .select(
        `
        *,
        bookclub_settings(*),
        bookclub_schedule_candidates(*),
        bookclub_members(
          *,
          users(display_name, avatar_url)
        ),
        bookclub_progress(*),
        users!bookclubs_created_by_fkey(display_name, avatar_url)
      `
      )
      .eq('id', id)
      .single();

    if (error || !bookclub) {
      return NextResponse.json({ error: '読書会が見つかりません' }, { status: 404 });
    }

    const settings = bookclub.bookclub_settings?.[0];
    const schedules = bookclub.bookclub_schedule_candidates || [];
    const members = bookclub.bookclub_members || [];
    const progress = bookclub.bookclub_progress || [];

    // 平均進捗計算
    const avgProgress =
      progress.length > 0
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
        name: bookclub.users?.display_name || '不明',
        avatar_url: bookclub.users?.avatar_url,
      },
      settings: {
        max_participants: settings?.max_participants || 10,
        is_public: settings?.is_public !== false,
        requires_approval: settings?.requires_approval || false,
        book_candidates: settings?.settings_json?.book_candidates || [],
      },
      schedule_candidates: schedules.map((schedule: ScheduleData) => ({
        id: schedule.id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
      })),
      members: members.map((member: MemberData) => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        name: member.users?.display_name || '不明',
        avatar_url: member.users?.avatar_url,
      })),
      member_count: members.length,
      progress: {
        average: avgProgress,
        individual: progress.map((p: ProgressData) => ({
          user_id: p.user_id,
          progress_rate: p.progress_rate,
          updated_at: p.updated_at,
        })),
      },
    });
  } catch (error) {
    console.error('Get bookclub details error:', error);
    return NextResponse.json({ error: '読書会の詳細取得に失敗しました' }, { status: 500 });
  }
}

// 読書会更新
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
        console.error('Error updating bookclub:', updateError);
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
        console.error('Error updating settings:', settingsError);
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
          console.error('Error updating schedule:', scheduleError);
        }
      }
    }

    return NextResponse.json({ message: '読書会が更新されました' });
  } catch (error) {
    console.error('Update bookclub error:', error);
    return NextResponse.json({ error: '読書会の更新に失敗しました' }, { status: 500 });
  }
}

// 読書会削除
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
      console.error('Error deleting bookclub:', deleteError);
      return NextResponse.json({ error: '読書会の削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ message: '読書会が削除されました' });
  } catch (error) {
    console.error('Delete bookclub error:', error);
    return NextResponse.json({ error: '読書会の削除に失敗しました' }, { status: 500 });
  }
}
