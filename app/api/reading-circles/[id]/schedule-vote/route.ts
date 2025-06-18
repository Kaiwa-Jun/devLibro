import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase/client';

interface ScheduleVoteRequest {
  schedule_id: string;
}

// スケジュール投票を追加/削除
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookclubId = params.id;
    const body: ScheduleVoteRequest = await request.json();
    const supabase = getSupabaseClient();

    // ユーザー認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 輪読会メンバーかチェック
    const { data: membership, error: membershipError } = await supabase
      .from('bookclub_members')
      .select('id')
      .eq('bookclub_id', bookclubId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: '輪読会のメンバーのみ投票できます' }, { status: 403 });
    }

    // スケジュールが輪読会の候補に含まれているかチェック
    const { data: scheduleCandidate, error: candidateError } = await supabase
      .from('bookclub_schedule_candidates')
      .select('id')
      .eq('bookclub_id', bookclubId)
      .eq('id', body.schedule_id)
      .single();

    if (candidateError || !scheduleCandidate) {
      return NextResponse.json(
        { error: '指定されたスケジュールは候補に含まれていません' },
        { status: 400 }
      );
    }

    // 既存の投票をチェック
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('bookclub_schedule_votes')
      .select('id')
      .eq('bookclub_id', bookclubId)
      .eq('schedule_id', body.schedule_id)
      .eq('user_id', user.id)
      .single();

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      // PGRST116 = レコードが見つからない（正常）
      console.error('Vote check error:', voteCheckError);
      return NextResponse.json({ error: '投票状態の確認に失敗しました' }, { status: 500 });
    }

    if (existingVote) {
      // 既存の投票を削除（投票取消）
      const { error: deleteError } = await supabase
        .from('bookclub_schedule_votes')
        .delete()
        .eq('id', existingVote.id);

      if (deleteError) {
        console.error('Vote deletion error:', deleteError);
        return NextResponse.json({ error: '投票の取り消しに失敗しました' }, { status: 500 });
      }

      return NextResponse.json({
        message: '投票を取り消しました',
        voted: false,
      });
    } else {
      // 新しい投票を追加
      const { error: insertError } = await supabase.from('bookclub_schedule_votes').insert({
        bookclub_id: bookclubId,
        schedule_id: body.schedule_id,
        user_id: user.id,
      });

      if (insertError) {
        console.error('Vote insertion error:', insertError);
        return NextResponse.json({ error: '投票に失敗しました' }, { status: 500 });
      }

      return NextResponse.json({
        message: '投票しました',
        voted: true,
      });
    }
  } catch (error) {
    console.error('Schedule vote error:', error);
    return NextResponse.json({ error: 'スケジュール投票に失敗しました' }, { status: 500 });
  }
}

// スケジュール投票情報を取得
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookclubId = params.id;
    const supabase = getSupabaseClient();

    // ユーザー認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // スケジュール候補と投票情報を取得
    const { data: scheduleVotes, error: votesError } = await supabase
      .from('bookclub_schedule_votes')
      .select(
        `
        schedule_id,
        user_id,
        bookclub_schedule_candidates!inner(
          id,
          day_of_week,
          start_time,
          end_time
        )
      `
      )
      .eq('bookclub_id', bookclubId);

    if (votesError) {
      console.error('Schedule votes fetch error:', votesError);
      return NextResponse.json(
        { error: 'スケジュール投票情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    // 投票数をカウント
    const votesBySchedule: Record<string, { count: number; userVoted: boolean }> = {};

    scheduleVotes?.forEach((vote: { schedule_id: string; user_id: string }) => {
      if (!votesBySchedule[vote.schedule_id]) {
        votesBySchedule[vote.schedule_id] = { count: 0, userVoted: false };
      }
      votesBySchedule[vote.schedule_id].count++;
      if (vote.user_id === user.id) {
        votesBySchedule[vote.schedule_id].userVoted = true;
      }
    });

    return NextResponse.json(votesBySchedule);
  } catch (error) {
    console.error('Schedule vote fetch error:', error);
    return NextResponse.json(
      { error: 'スケジュール投票情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
