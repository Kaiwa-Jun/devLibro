import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase/client';

interface VoteRequest {
  book_id: number;
  action: 'vote' | 'unvote';
}

// 投票を追加/削除
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookclubId = params.id;
    const body: VoteRequest = await request.json();
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

    // 書籍が輪読会の候補に含まれているかチェック
    const { data: bookCandidate, error: candidateError } = await supabase
      .from('bookclub_book_candidates')
      .select('id')
      .eq('bookclub_id', bookclubId)
      .eq('book_id', body.book_id)
      .single();

    if (candidateError || !bookCandidate) {
      return NextResponse.json(
        { error: '指定された書籍は候補に含まれていません' },
        { status: 400 }
      );
    }

    if (body.action === 'vote') {
      // 投票を追加（既に投票済みの場合はエラーにならない）
      const { error: voteError } = await supabase.from('bookclub_book_votes').insert({
        bookclub_id: bookclubId,
        book_id: body.book_id,
        user_id: user.id,
      });

      if (voteError && voteError.code !== '23505') {
        // 23505は重複エラー（既に投票済み）
        console.error('Vote error:', voteError);
        return NextResponse.json({ error: '投票に失敗しました' }, { status: 500 });
      }
    } else if (body.action === 'unvote') {
      // 投票を削除
      const { error: unvoteError } = await supabase
        .from('bookclub_book_votes')
        .delete()
        .eq('bookclub_id', bookclubId)
        .eq('book_id', body.book_id)
        .eq('user_id', user.id);

      if (unvoteError) {
        console.error('Unvote error:', unvoteError);
        return NextResponse.json({ error: '投票の取り消しに失敗しました' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: '無効なアクションです' }, { status: 400 });
    }

    // 更新された投票数を取得
    const { data: voteCount, error: countError } = await supabase
      .from('bookclub_book_votes')
      .select('id', { count: 'exact' })
      .eq('bookclub_id', bookclubId)
      .eq('book_id', body.book_id);

    if (countError) {
      console.error('Count error:', countError);
      return NextResponse.json({ error: '投票数の取得に失敗しました' }, { status: 500 });
    }

    // ユーザーが投票済みかチェック
    const { data: userVote, error: userVoteError } = await supabase
      .from('bookclub_book_votes')
      .select('id')
      .eq('bookclub_id', bookclubId)
      .eq('book_id', body.book_id)
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      vote_count: voteCount?.length || 0,
      user_voted: !userVoteError && !!userVote,
    });
  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json({ error: '投票処理に失敗しました' }, { status: 500 });
  }
}
