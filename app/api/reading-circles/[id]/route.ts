import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  getReadingCircleById,
  updateReadingCircle,
  deleteReadingCircle,
} from '@/lib/supabase/reading-circles';
import { createClient } from '@/lib/supabase/server';

const updateCircleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  max_participants: z.number().int().min(2).max(50).optional(),
  is_private: z.boolean().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['draft', 'recruiting', 'active', 'completed', 'cancelled']).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const circle = await getReadingCircleById(params.id);

    return NextResponse.json({
      data: circle,
      message: 'Reading circle fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching reading circle:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Reading circle not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the creator or has permission to edit
    const existingCircle = await getReadingCircleById(params.id);
    if (existingCircle.created_by !== user.id) {
      // Check if user is an organizer
      const { data: participant } = await supabase
        .from('circle_participants')
        .select('role')
        .eq('circle_id', params.id)
        .eq('user_id', user.id)
        .eq('role', 'organizer')
        .eq('status', 'approved')
        .single();

      if (!participant) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to edit this circle' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateCircleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedCircle = await updateReadingCircle(params.id, validationResult.data);

    return NextResponse.json({
      data: updatedCircle,
      message: 'Reading circle updated successfully',
    });
  } catch (error) {
    console.error('Error updating reading circle:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Reading circle not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the creator
    const existingCircle = await getReadingCircleById(params.id);
    if (existingCircle.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only the creator can delete this circle' },
        { status: 403 }
      );
    }

    await deleteReadingCircle(params.id);

    return NextResponse.json({
      message: 'Reading circle deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting reading circle:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Reading circle not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
