import { getSupabaseClient } from '@/lib/supabase/client';

// Client-side version for use in components
export async function getReadingCircleByIdClient(id: string) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('reading_circles')
      .select(
        `
        *,
        books!inner (
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
          *,
          users (
            id,
            display_name
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching reading circle:', error);
      throw new Error('Failed to fetch reading circle');
    }

    return data;
  } catch (error) {
    console.error('Error in getReadingCircleByIdClient:', error);
    throw error;
  }
}

export async function getReadingCirclesClient(
  filters: {
    status?: string;
    isPrivate?: boolean;
    limit?: number;
    offset?: number;
  } = {}
) {
  try {
    const supabase = getSupabaseClient();

    let query = supabase
      .from('reading_circles')
      .select(
        `
        *,
        books!inner (
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

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.isPrivate !== undefined) {
      query = query.eq('is_private', filters.isPrivate);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reading circles:', error);
      throw new Error('Failed to fetch reading circles');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getReadingCirclesClient:', error);
    throw error;
  }
}

export async function joinReadingCircleClient(circleId: string, userId: string) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('circle_participants')
      .insert([
        {
          circle_id: circleId,
          user_id: userId,
          role: 'member',
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error joining reading circle:', error);
      throw new Error('Failed to join reading circle');
    }

    return data;
  } catch (error) {
    console.error('Error in joinReadingCircleClient:', error);
    throw error;
  }
}
