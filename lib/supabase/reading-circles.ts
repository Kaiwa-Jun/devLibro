import { ReadingCircle, CircleParticipant } from '@/types';

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
  const supabase = createClient();
  const { data, error } = await supabase
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
  const supabase = createClient();
  const { data, error } = await supabase.from('reading_circles').insert([circle]).select().single();

  if (error) {
    throw new Error(`Failed to create reading circle: ${error.message}`);
  }

  // Create the organizer participant record
  await addCircleParticipant(data.id, circle.created_by, 'organizer', 'approved');

  return data;
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
  const supabase = createClient();
  const { data, error } = await supabase
    .from('circle_participants')
    .insert([
      {
        circle_id: circleId,
        user_id: userId,
        role,
        status,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add participant: ${error.message}`);
  }

  // Update participant count
  await updateParticipantCount(circleId);

  return data;
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
  const supabase = createClient();
  const { count } = await supabase
    .from('circle_participants')
    .select('*', { count: 'exact' })
    .eq('circle_id', circleId)
    .eq('status', 'approved');

  await createClient()
    .from('reading_circles')
    .update({ participant_count: count || 0 })
    .eq('id', circleId);
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
