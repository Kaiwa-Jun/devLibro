import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  addCircleParticipant,
  getCircleParticipants,
  getReadingCircleById,
  updateCircleParticipant,
} from '@/lib/supabase/reading-circles';

const addParticipantSchema = z.object({
  user_id: z.string().uuid().optional(), // Optional for self-join
  role: z.enum(['organizer', 'participant']).default('participant'),
});

const updateParticipantSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'left']),
  participant_id: z.string().uuid(),
});

// 認証ヘルパー関数
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const { getSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  return user;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('👥 [参加者取得API] リクエスト開始:', params.id);

    const user = await authenticateUser(request);
    if (!user) {
      console.log('❌ [参加者取得API] 認証失敗');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [参加者取得API] 認証成功:', user.id);

    const participants = await getCircleParticipants(params.id);
    console.log('✅ [参加者取得API] 参加者取得成功');

    return NextResponse.json({
      data: participants,
      message: 'Participants fetched successfully',
    });
  } catch (error) {
    console.error('❌ [参加者取得API] エラー:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('➕ [参加申請API] リクエスト開始:', params.id);

    const user = await authenticateUser(request);
    if (!user) {
      console.log('❌ [参加申請API] 認証失敗');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [参加申請API] 認証成功:', user.id);

    const body = await request.json();
    console.log('📝 [参加申請API] リクエストボディ:', body);

    // Validate request body
    const validationResult = addParticipantSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('❌ [参加申請API] バリデーションエラー:', validationResult.error);
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { user_id, role } = validationResult.data;
    const targetUserId = user_id || user.id; // If no user_id provided, user is joining themselves
    console.log('🎯 [参加申請API] 対象ユーザー:', targetUserId, 'ロール:', role);

    // Check if circle exists and get details
    const circle = await getReadingCircleById(params.id);
    console.log(
      '🔍 [参加申請API] 輪読会確認:',
      circle.status,
      '参加者数:',
      circle.participant_count,
      '/',
      circle.max_participants
    );

    // Check if circle is accepting participants
    if (circle.status === 'completed' || circle.status === 'cancelled') {
      console.log('❌ [参加申請API] 輪読会が終了または中止済み');
      return NextResponse.json(
        { error: 'Cannot join a completed or cancelled circle' },
        { status: 400 }
      );
    }

    // Check if user is already a participant
    const { getSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = getSupabaseServerClient();

    const { data: existingParticipant } = await supabase
      .from('circle_participants')
      .select('id, status')
      .eq('circle_id', params.id)
      .eq('user_id', targetUserId)
      .single();

    if (existingParticipant) {
      console.log('❌ [参加申請API] 既に参加済み:', existingParticipant);
      return NextResponse.json({ error: 'User is already a participant' }, { status: 400 });
    }

    // Check participant limit
    if (circle.participant_count >= circle.max_participants) {
      console.log('❌ [参加申請API] 参加者数上限に達している');
      return NextResponse.json(
        { error: 'Circle has reached maximum participants' },
        { status: 400 }
      );
    }

    // For adding others as organizer, check permissions
    if (user_id && user_id !== user.id) {
      console.log('🔍 [参加申請API] 他ユーザーの追加 - 権限チェック');
      if (circle.created_by !== user.id) {
        // Check if user is an organizer
        const { data: userParticipant } = await supabase
          .from('circle_participants')
          .select('role')
          .eq('circle_id', params.id)
          .eq('user_id', user.id)
          .eq('role', 'organizer')
          .eq('status', 'approved')
          .single();

        if (!userParticipant) {
          console.log('❌ [参加申請API] 権限なし - 主催者またはオーガナイザーのみ');
          return NextResponse.json(
            { error: 'Forbidden: You do not have permission to add participants' },
            { status: 403 }
          );
        }
      }
    }

    // Determine initial status
    let initialStatus: 'pending' | 'approved' = 'pending';
    if (circle.created_by === user.id || role === 'organizer') {
      initialStatus = 'approved';
    }
    console.log('📋 [参加申請API] 初期ステータス:', initialStatus);

    console.log('➕ [参加申請API] 参加者追加実行中...');
    const participant = await addCircleParticipant(params.id, targetUserId, role, initialStatus);
    console.log('✅ [参加申請API] 参加者追加成功');

    return NextResponse.json(
      {
        data: participant,
        message: 'Participant added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [参加申請API] エラー:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔄 [参加者ステータス更新API] リクエスト開始:', params.id);

    const user = await authenticateUser(request);
    if (!user) {
      console.log('❌ [参加者ステータス更新API] 認証失敗');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [参加者ステータス更新API] 認証成功:', user.id);

    const body = await request.json();
    console.log('📝 [参加者ステータス更新API] リクエストボディ:', body);

    // Validate request body
    const validationResult = updateParticipantSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('❌ [参加者ステータス更新API] バリデーションエラー:', validationResult.error);
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status, participant_id } = validationResult.data;
    console.log('🎯 [参加者ステータス更新API] 更新内容:', { status, participant_id });

    // Check if circle exists
    const circle = await getReadingCircleById(params.id);
    console.log('🔍 [参加者ステータス更新API] 輪読会確認:', circle.created_by);

    const { getSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = getSupabaseServerClient();

    // Check permissions for status updates
    if (status === 'approved' || status === 'rejected') {
      console.log('🔍 [参加者ステータス更新API] 承認/拒否 - 権限チェック');
      // Only organizers can approve/reject
      if (circle.created_by !== user.id) {
        const { data: userParticipant } = await supabase
          .from('circle_participants')
          .select('role')
          .eq('circle_id', params.id)
          .eq('user_id', user.id)
          .eq('role', 'organizer')
          .eq('status', 'approved')
          .single();

        if (!userParticipant) {
          console.log('❌ [参加者ステータス更新API] 権限なし - 主催者またはオーガナイザーのみ');
          return NextResponse.json(
            { error: 'Forbidden: You do not have permission to approve/reject participants' },
            { status: 403 }
          );
        }
      }
    } else if (status === 'left') {
      console.log('🔍 [参加者ステータス更新API] 退会 - 権限チェック');
      // Users can leave themselves, or organizers can remove others
      const { data: participant } = await supabase
        .from('circle_participants')
        .select('user_id')
        .eq('id', participant_id)
        .single();

      if (participant?.user_id !== user.id && circle.created_by !== user.id) {
        const { data: userParticipant } = await supabase
          .from('circle_participants')
          .select('role')
          .eq('circle_id', params.id)
          .eq('user_id', user.id)
          .eq('role', 'organizer')
          .eq('status', 'approved')
          .single();

        if (!userParticipant) {
          console.log(
            '❌ [参加者ステータス更新API] 権限なし - 自分の退会またはオーガナイザーによる削除のみ'
          );
          return NextResponse.json(
            { error: 'Forbidden: You can only leave yourself or remove others as an organizer' },
            { status: 403 }
          );
        }
      }
    }

    console.log('🔄 [参加者ステータス更新API] ステータス更新実行中...');
    const updatedParticipant = await updateCircleParticipant(participant_id, {
      status,
    });
    console.log('✅ [参加者ステータス更新API] ステータス更新成功');

    return NextResponse.json({
      data: updatedParticipant,
      message: 'Participant status updated successfully',
    });
  } catch (error) {
    console.error('❌ [参加者ステータス更新API] エラー:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
