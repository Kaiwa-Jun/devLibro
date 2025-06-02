import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  getCircleParticipants,
  addCircleParticipant,
  updateCircleParticipant,
  getReadingCircleById,
} from '@/lib/supabase/reading-circles';
import { createClient } from '@/lib/supabase/server';

const addParticipantSchema = z.object({
  user_id: z.string().uuid().optional(), // Optional for self-join
  role: z.enum(['organizer', 'participant']).default('participant'),
});

const updateParticipantSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'left']),
  participant_id: z.string().uuid(),
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

    const participants = await getCircleParticipants(params.id);

    return NextResponse.json({
      data: participants,
      message: 'Participants fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = addParticipantSchema.safeParse(body);
    if (!validationResult.success) {
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

    // Check if circle exists and get details
    const circle = await getReadingCircleById(params.id);

    // Check if circle is accepting participants
    if (circle.status === 'completed' || circle.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot join a completed or cancelled circle' },
        { status: 400 }
      );
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from('circle_participants')
      .select('id, status')
      .eq('circle_id', params.id)
      .eq('user_id', targetUserId)
      .single();

    if (existingParticipant) {
      return NextResponse.json({ error: 'User is already a participant' }, { status: 400 });
    }

    // Check participant limit
    if (circle.participant_count >= circle.max_participants) {
      return NextResponse.json(
        { error: 'Circle has reached maximum participants' },
        { status: 400 }
      );
    }

    // For adding others as organizer, check permissions
    if (user_id && user_id !== user.id) {
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

    const participant = await addCircleParticipant(params.id, targetUserId, role, initialStatus);

    return NextResponse.json(
      {
        data: participant,
        message: 'Participant added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = updateParticipantSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status, participant_id } = validationResult.data;

    // Check if circle exists
    const circle = await getReadingCircleById(params.id);

    // Check permissions for status updates
    if (status === 'approved' || status === 'rejected') {
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
          return NextResponse.json(
            { error: 'Forbidden: You do not have permission to approve/reject participants' },
            { status: 403 }
          );
        }
      }
    } else if (status === 'left') {
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
          return NextResponse.json(
            { error: 'Forbidden: You can only leave yourself or remove others as an organizer' },
            { status: 403 }
          );
        }
      }
    }

    const updatedParticipant = await updateCircleParticipant(participant_id, {
      status,
    });

    return NextResponse.json({
      data: updatedParticipant,
      message: 'Participant status updated successfully',
    });
  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
