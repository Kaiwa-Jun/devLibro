import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getReadingCircles, createReadingCircle } from '@/lib/supabase/reading-circles';
import { createClient } from '@/lib/supabase/server';

const createCircleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  book_id: z.number().int().positive(),
  max_participants: z.number().int().min(2).max(50).default(10),
  is_private: z.boolean().default(false),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const isPrivate = searchParams.get('is_private');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const filters = {
      ...(status && { status }),
      ...(isPrivate !== null && { isPrivate: isPrivate === 'true' }),
      ...(limit && { limit: parseInt(limit) }),
      ...(offset && { offset: parseInt(offset) }),
    };

    const circles = await getReadingCircles(filters);

    return NextResponse.json({
      data: circles,
      message: 'Reading circles fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching reading circles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const validationResult = createCircleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const circleData = {
      ...validationResult.data,
      created_by: user.id,
      status: 'draft' as const,
    };

    const circle = await createReadingCircle(circleData);

    return NextResponse.json(
      {
        data: circle,
        message: 'Reading circle created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating reading circle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
