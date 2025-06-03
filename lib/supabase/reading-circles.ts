import { CircleParticipant, ReadingCircle } from '@/types';

import { createClient } from './server';

export async function getReadingCircles(filters?: {
  status?: string;
  isPrivate?: boolean;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();
  let query = supabase
    .from('reading_circles')
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        img_url
      ),
      users!reading_circles_created_by_fkey (
        id,
        display_name
      )
    `
    )
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.isPrivate !== undefined) {
    query = query.eq('is_private', filters.isPrivate);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch reading circles: ${error.message}`);
  }

  return data;
}

export async function getReadingCircleById(id: string) {
  const supabaseClient = createClient();
  const { data, error } = await supabaseClient
    .from('reading_circles')
    .select(
      `
      *,
      books (
        id,
        title,
        author,
        img_url,
        description,
        page_count
      ),
      users!reading_circles_created_by_fkey (
        id,
        display_name
      ),
      circle_participants (
        id,
        user_id,
        role,
        status,
        joined_at,
        users (
          id,
          display_name
        )
      ),
      circle_schedules (
        id,
        title,
        description,
        scheduled_date,
        start_page,
        end_page,
        is_ai_generated
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch reading circle: ${error.message}`);
  }

  return data;
}

export async function createReadingCircle(
  circle: Omit<ReadingCircle, 'id' | 'created_at' | 'updated_at' | 'participant_count'>
) {
  console.log('🎯 [createReadingCircle] 関数開始');
  console.log('📝 [createReadingCircle] 受信データ:', JSON.stringify(circle, null, 2));

  const supabase = createClient();
  console.log('✅ [createReadingCircle] Supabaseクライアント作成完了');

  try {
    console.log('💾 [createReadingCircle] 輪読会データ挿入開始');
    const { data, error } = await supabase
      .from('reading_circles')
      .insert([circle])
      .select()
      .single();

    if (error) {
      console.error('❌ [createReadingCircle] 輪読会挿入エラー:', error);
      console.error('❌ [createReadingCircle] エラーコード:', error.code);
      console.error('❌ [createReadingCircle] エラーメッセージ:', error.message);
      console.error('❌ [createReadingCircle] エラー詳細:', error.details);
      throw new Error(`Failed to create reading circle: ${error.message}`);
    }

    console.log('✅ [createReadingCircle] 輪読会挿入成功:', data);

    // Create the organizer participant record
    console.log('👥 [createReadingCircle] 主催者参加者レコード作成開始');
    try {
      await addCircleParticipant(data.id, circle.created_by, 'organizer', 'approved');
      console.log('✅ [createReadingCircle] 主催者参加者レコード作成成功');
    } catch (participantError) {
      console.error('❌ [createReadingCircle] 主催者参加者レコード作成エラー:', participantError);
      // 参加者レコード作成に失敗した場合、作成した輪読会を削除
      try {
        await supabase.from('reading_circles').delete().eq('id', data.id);
        console.log('🗑️ [createReadingCircle] 失敗した輪読会レコードを削除しました');
      } catch (deleteError) {
        console.error('❌ [createReadingCircle] 輪読会レコード削除エラー:', deleteError);
      }
      throw participantError;
    }

    console.log('🎉 [createReadingCircle] 輪読会作成完了:', data.id);
    return data;
  } catch (error) {
    console.error('❌ [createReadingCircle] 予期しないエラー:', error);
    console.error(
      '❌ [createReadingCircle] エラースタック:',
      error instanceof Error ? error.stack : 'スタック情報なし'
    );
    throw error;
  }
}

export async function updateReadingCircle(id: string, updates: Partial<ReadingCircle>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('reading_circles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update reading circle: ${error.message}`);
  }

  return data;
}

export async function deleteReadingCircle(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('reading_circles').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete reading circle: ${error.message}`);
  }

  return true;
}

export async function addCircleParticipant(
  circleId: string,
  userId: string,
  role: 'organizer' | 'participant' = 'participant',
  status: 'pending' | 'approved' | 'rejected' | 'left' = 'pending'
) {
  console.log('👥 [addCircleParticipant] 関数開始');
  console.log('📝 [addCircleParticipant] パラメータ:', { circleId, userId, role, status });

  const supabase = createClient();
  console.log('✅ [addCircleParticipant] Supabaseクライアント作成完了');

  try {
    const participantData = {
      circle_id: circleId,
      user_id: userId,
      role,
      status,
    };

    console.log('💾 [addCircleParticipant] 参加者データ挿入開始:', participantData);

    const { data, error } = await supabase
      .from('circle_participants')
      .insert([participantData])
      .select()
      .single();

    if (error) {
      console.error('❌ [addCircleParticipant] 参加者挿入エラー:', error);
      console.error('❌ [addCircleParticipant] エラーコード:', error.code);
      console.error('❌ [addCircleParticipant] エラーメッセージ:', error.message);
      console.error('❌ [addCircleParticipant] エラー詳細:', error.details);
      throw new Error(`Failed to add participant: ${error.message}`);
    }

    console.log('✅ [addCircleParticipant] 参加者挿入成功:', data);

    // Update participant count
    console.log('🔢 [addCircleParticipant] 参加者数更新開始');
    try {
      await updateParticipantCount(circleId);
      console.log('✅ [addCircleParticipant] 参加者数更新成功');
    } catch (countError) {
      console.error('❌ [addCircleParticipant] 参加者数更新エラー:', countError);
      // 参加者数更新に失敗してもエラーにはしない（警告のみ）
    }

    console.log('🎉 [addCircleParticipant] 参加者追加完了:', data.id);
    return data;
  } catch (error) {
    console.error('❌ [addCircleParticipant] 予期しないエラー:', error);
    console.error(
      '❌ [addCircleParticipant] エラースタック:',
      error instanceof Error ? error.stack : 'スタック情報なし'
    );
    throw error;
  }
}

export async function updateCircleParticipant(
  participantId: string,
  updates: Partial<CircleParticipant>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('circle_participants')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', participantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update participant: ${error.message}`);
  }

  // Update participant count
  if (updates.status) {
    const participant = await createClient()
      .from('circle_participants')
      .select('circle_id')
      .eq('id', participantId)
      .single();

    if (participant.data) {
      await updateParticipantCount(participant.data.circle_id);
    }
  }

  return data;
}

export async function removeCircleParticipant(participantId: string) {
  const supabase = createClient();
  // Get circle_id before deletion
  const { data: participant } = await supabase
    .from('circle_participants')
    .select('circle_id')
    .eq('id', participantId)
    .single();

  const { error } = await supabase.from('circle_participants').delete().eq('id', participantId);

  if (error) {
    throw new Error(`Failed to remove participant: ${error.message}`);
  }

  // Update participant count
  if (participant?.circle_id) {
    await updateParticipantCount(participant.circle_id);
  }

  return true;
}

async function updateParticipantCount(circleId: string) {
  console.log('🔢 [updateParticipantCount] 関数開始:', circleId);

  const supabase = createClient();
  console.log('✅ [updateParticipantCount] Supabaseクライアント作成完了');

  try {
    console.log('📊 [updateParticipantCount] 承認済み参加者数カウント開始');
    const { count, error: countError } = await supabase
      .from('circle_participants')
      .select('*', { count: 'exact' })
      .eq('circle_id', circleId)
      .eq('status', 'approved');

    if (countError) {
      console.error('❌ [updateParticipantCount] 参加者数カウントエラー:', countError);
      throw new Error(`Failed to count participants: ${countError.message}`);
    }

    console.log('📊 [updateParticipantCount] 参加者数カウント結果:', count);

    console.log('💾 [updateParticipantCount] 輪読会の参加者数更新開始');
    const { error: updateError } = await supabase
      .from('reading_circles')
      .update({ participant_count: count || 0 })
      .eq('id', circleId);

    if (updateError) {
      console.error('❌ [updateParticipantCount] 参加者数更新エラー:', updateError);
      throw new Error(`Failed to update participant count: ${updateError.message}`);
    }

    console.log('✅ [updateParticipantCount] 参加者数更新成功:', count || 0);
  } catch (error) {
    console.error('❌ [updateParticipantCount] 予期しないエラー:', error);
    console.error(
      '❌ [updateParticipantCount] エラースタック:',
      error instanceof Error ? error.stack : 'スタック情報なし'
    );
    throw error;
  }
}

export async function getCircleParticipants(circleId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('circle_participants')
    .select(
      `
      *,
      users (
        id,
        display_name,
        avatar_url
      )
    `
    )
    .eq('circle_id', circleId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch participants: ${error.message}`);
  }

  return data;
}
