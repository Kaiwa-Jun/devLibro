import { NextRequest, NextResponse } from 'next/server';

import { createApiRouteSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface JoinBookclubRequest {
  message?: string;
}

// 招待コードで読書会に参加
export async function POST(request: NextRequest, { params }: { params: { inviteCode: string } }) {
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

    const { inviteCode } = params;
    const body: JoinBookclubRequest = await request.json();

    // 招待URLから読書会を検索
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reading-circles/join/${inviteCode}`;

    const { data: bookclub, error: bookclubError } = await supabase
      .from('bookclubs')
      .select(
        `
        *,
        bookclub_settings(max_participants, requires_approval),
        bookclub_members(count)
      `
      )
      .eq('invite_url', inviteUrl)
      .single();

    if (bookclubError || !bookclub) {
      return NextResponse.json({ error: '無効な招待コードです' }, { status: 404 });
    }

    // 読書会のステータスチェック
    if (bookclub.status !== 'recruiting') {
      return NextResponse.json(
        { error: 'この読書会は現在参加を受け付けていません' },
        { status: 400 }
      );
    }

    // 既に参加しているかチェック
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('bookclub_members')
      .select('id')
      .eq('bookclub_id', bookclub.id)
      .eq('user_id', user.id)
      .single();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      console.error('Error checking existing membership:', memberCheckError);
      return NextResponse.json({ error: 'メンバーシップの確認に失敗しました' }, { status: 500 });
    }

    if (existingMember) {
      return NextResponse.json({ error: '既にこの読書会に参加しています' }, { status: 400 });
    }

    // 定員チェック
    const settings = bookclub.bookclub_settings?.[0];
    const currentMemberCount = bookclub.bookclub_members?.length || 0;
    const maxParticipants = settings?.max_participants || 10;

    if (currentMemberCount >= maxParticipants) {
      return NextResponse.json({ error: '定員に達しています' }, { status: 400 });
    }

    // 承認が必要な場合の処理
    if (settings?.requires_approval) {
      // 参加申請として追加（将来の機能）
      const { error: applicationError } = await supabase.from('bookclub_applications').insert([
        {
          bookclub_id: bookclub.id,
          user_id: user.id,
          message: body.message,
          status: 'pending',
        },
      ]);

      if (applicationError) {
        console.error('Error creating application:', applicationError);
        return NextResponse.json({ error: '参加申請の送信に失敗しました' }, { status: 500 });
      }

      return NextResponse.json({
        message: '参加申請を送信しました。主催者の承認をお待ちください。',
        status: 'pending_approval',
      });
    }

    // 直接参加
    const { error: joinError } = await supabase.from('bookclub_members').insert([
      {
        bookclub_id: bookclub.id,
        user_id: user.id,
        role: 'member',
      },
    ]);

    if (joinError) {
      console.error('Error joining bookclub:', joinError);
      return NextResponse.json({ error: '読書会への参加に失敗しました' }, { status: 500 });
    }

    // 進捗データを初期化
    const { error: progressError } = await supabase.from('bookclub_progress').insert([
      {
        bookclub_id: bookclub.id,
        user_id: user.id,
        progress_rate: 0,
      },
    ]);

    if (progressError) {
      console.error('Error initializing progress:', progressError);
      // 進捗データの初期化に失敗しても参加は継続
    }

    return NextResponse.json({
      message: '読書会に参加しました！',
      status: 'joined',
      bookclub: {
        id: bookclub.id,
        title: bookclub.title,
        description: bookclub.description,
      },
    });
  } catch (error) {
    console.error('Join bookclub error:', error);
    return NextResponse.json({ error: '読書会への参加に失敗しました' }, { status: 500 });
  }
}

// 招待コードの詳細情報を取得
export async function GET(request: NextRequest, { params }: { params: { inviteCode: string } }) {
  try {
    const supabase = createApiRouteSupabaseClient();
    const { inviteCode } = params;

    // 招待URLから読書会を検索
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reading-circles/join/${inviteCode}`;

    const { data: bookclub, error: bookclubError } = await supabase
      .from('bookclubs')
      .select(
        `
        *,
        bookclub_settings(max_participants, is_public, requires_approval),
        bookclub_members(count),
        users!bookclubs_created_by_fkey(display_name)
      `
      )
      .eq('invite_url', inviteUrl)
      .single();

    if (bookclubError || !bookclub) {
      return NextResponse.json({ error: '無効な招待コードです' }, { status: 404 });
    }

    const settings = bookclub.bookclub_settings?.[0];
    const currentMemberCount = bookclub.bookclub_members?.length || 0;

    return NextResponse.json({
      id: bookclub.id,
      title: bookclub.title,
      purpose: bookclub.purpose,
      description: bookclub.description,
      status: bookclub.status,
      organizer: bookclub.users?.display_name || '不明',
      current_members: currentMemberCount,
      max_participants: settings?.max_participants || 10,
      requires_approval: settings?.requires_approval || false,
      is_public: settings?.is_public || true,
      created_at: bookclub.created_at,
    });
  } catch (error) {
    console.error('Get invite details error:', error);
    return NextResponse.json({ error: '招待情報の取得に失敗しました' }, { status: 500 });
  }
}
