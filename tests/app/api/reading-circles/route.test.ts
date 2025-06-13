/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

import { POST, GET } from '@/app/api/reading-circles/route';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Supabaseクライアントをモック
jest.mock('@/lib/supabase/server');

const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
      range: jest.fn(() => ({
        order: jest.fn(),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

(getSupabaseServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);

describe('/api/reading-circles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  describe('POST /api/reading-circles', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    };

    const validRequestBody = {
      title: 'テスト読書会',
      purpose: 'TypeScriptを学ぶ',
      description: 'TypeScriptの基礎から応用まで学びます',
      book_candidates: [1, 2, 3],
      schedule_candidates: [
        {
          day_of_week: 1,
          start_time: '19:00',
          end_time: '21:00',
        },
      ],
      max_participants: 10,
      is_public: true,
      requires_approval: false,
    };

    it('正常に読書会を作成できること', async () => {
      // モックの設定
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockBookclub = {
        id: 'bookclub-123',
        title: validRequestBody.title,
        purpose: validRequestBody.purpose,
        description: validRequestBody.description,
        status: 'recruiting',
        invite_url: 'http://localhost:3000/reading-circles/join/abcd1234',
        created_by: mockUser.id,
        created_at: '2023-01-01T00:00:00Z',
      };

      const insertMock = jest.fn().mockResolvedValue({
        data: mockBookclub,
        error: null,
      });

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'bookclubs') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: insertMock,
              })),
            })),
          };
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/reading-circles', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe(validRequestBody.title);
      expect(data.purpose).toBe(validRequestBody.purpose);
      expect(data.status).toBe('recruiting');
      expect(data.invite_url).toContain('/reading-circles/join/');
      expect(data.member_count).toBe(1);
    });

    it('認証されていない場合は401エラーを返すこと', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest('http://localhost:3000/api/reading-circles', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('認証が必要です');
    });

    it('タイトルが空の場合は400エラーを返すこと', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const invalidRequestBody = {
        ...validRequestBody,
        title: '',
      };

      const request = new NextRequest('http://localhost:3000/api/reading-circles', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('タイトルは必須です');
    });

    it('タイトルが100文字を超える場合は400エラーを返すこと', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const invalidRequestBody = {
        ...validRequestBody,
        title: 'a'.repeat(101),
      };

      const request = new NextRequest('http://localhost:3000/api/reading-circles', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('タイトルは100文字以内で入力してください');
    });

    it('無効な時間形式の場合は400エラーを返すこと', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const invalidRequestBody = {
        ...validRequestBody,
        schedule_candidates: [
          {
            day_of_week: 1,
            start_time: '25:00', // 無効な時間
            end_time: '21:00',
          },
        ],
      };

      const request = new NextRequest('http://localhost:3000/api/reading-circles', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('時間は HH:MM 形式で入力してください');
    });

    it('開始時間が終了時間より後の場合は400エラーを返すこと', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const invalidRequestBody = {
        ...validRequestBody,
        schedule_candidates: [
          {
            day_of_week: 1,
            start_time: '21:00',
            end_time: '19:00', // 開始時間より早い
          },
        ],
      };

      const request = new NextRequest('http://localhost:3000/api/reading-circles', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('開始時間は終了時間より前である必要があります');
    });
  });

  describe('GET /api/reading-circles', () => {
    it('読書会一覧を正常に取得できること', async () => {
      const mockBookclubs = [
        {
          id: 'bookclub-1',
          title: '読書会1',
          purpose: '目的1',
          description: '説明1',
          status: 'recruiting',
          invite_url: 'http://localhost:3000/reading-circles/join/code1',
          created_by: 'user-1',
          created_at: '2023-01-01T00:00:00Z',
          bookclub_members: [{ id: 'member-1' }],
          bookclub_settings: [{ max_participants: 10, is_public: true }],
          bookclub_schedule_candidates: [],
        },
      ];

      const selectMock = jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        range: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: mockBookclubs,
            error: null,
          }),
        })),
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: selectMock,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reading-circles?limit=10&offset=0'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bookclubs).toHaveLength(1);
      expect(data.bookclubs[0].title).toBe('読書会1');
      expect(data.bookclubs[0].member_count).toBe(1);
    });
  });
});
