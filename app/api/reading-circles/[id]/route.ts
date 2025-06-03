import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  deleteReadingCircle,
  getReadingCircleById,
  updateReadingCircle,
} from '@/lib/supabase/reading-circles';

const updateCircleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  max_participants: z.number().int().min(2).max(50).optional(),
  is_private: z.boolean().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['draft', 'recruiting', 'active', 'completed', 'cancelled']).optional(),
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
    console.log('🔍 [輪読会詳細取得API] リクエスト開始:', params.id);

    const user = await authenticateUser(request);
    if (!user) {
      console.log('❌ [輪読会詳細取得API] 認証失敗');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [輪読会詳細取得API] 認証成功:', user.id);

    const circle = await getReadingCircleById(params.id);
    console.log('✅ [輪読会詳細取得API] 輪読会取得成功');

    return NextResponse.json({
      data: circle,
      message: 'Reading circle fetched successfully',
    });
  } catch (error) {
    console.error('❌ [輪読会詳細取得API] エラー:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Reading circle not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔄 [輪読会更新API] リクエスト開始:', params.id);

    const user = await authenticateUser(request);
    if (!user) {
      console.log('❌ [輪読会更新API] 認証失敗');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [輪読会更新API] 認証成功:', user.id);

    // Check if user is the creator or has permission to edit
    const existingCircle = await getReadingCircleById(params.id);
    console.log('🔍 [輪読会更新API] 既存輪読会確認:', existingCircle.created_by);

    if (existingCircle.created_by !== user.id) {
      // Check if user is an organizer
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const supabase = getSupabaseServerClient();

      const { data: participant } = await supabase
        .from('circle_participants')
        .select('role')
        .eq('circle_id', params.id)
        .eq('user_id', user.id)
        .eq('role', 'organizer')
        .eq('status', 'approved')
        .single();

      if (!participant) {
        console.log('❌ [輪読会更新API] 権限なし');
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to edit this circle' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    console.log('📝 [輪読会更新API] リクエストボディ:', body);

    // Validate request body
    const validationResult = updateCircleSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('❌ [輪読会更新API] バリデーションエラー:', validationResult.error);
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedCircle = await updateReadingCircle(params.id, validationResult.data);
    console.log('✅ [輪読会更新API] 更新成功');

    return NextResponse.json({
      data: updatedCircle,
      message: 'Reading circle updated successfully',
    });
  } catch (error) {
    console.error('❌ [輪読会更新API] エラー:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Reading circle not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🗑️ [輪読会削除API] リクエスト開始:', params.id);

    const user = await authenticateUser(request);
    if (!user) {
      console.log('❌ [輪読会削除API] 認証失敗');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [輪読会削除API] 認証成功:', user.id);

    // Check if user is the creator
    const existingCircle = await getReadingCircleById(params.id);
    console.log('🔍 [輪読会削除API] 既存輪読会確認:', existingCircle.created_by);

    if (existingCircle.created_by !== user.id) {
      console.log('❌ [輪読会削除API] 権限なし - 作成者のみ削除可能');
      return NextResponse.json(
        { error: 'Forbidden: Only the creator can delete this circle' },
        { status: 403 }
      );
    }

    console.log('🗑️ [輪読会削除API] 削除実行中...');
    await deleteReadingCircle(params.id);
    console.log('✅ [輪読会削除API] 削除成功');

    return NextResponse.json({
      message: 'Reading circle deleted successfully',
    });
  } catch (error) {
    console.error('❌ [輪読会削除API] エラー:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Reading circle not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
