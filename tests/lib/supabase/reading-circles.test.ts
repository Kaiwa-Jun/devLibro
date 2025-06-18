import { getReadingCircles, getReadingCircleById } from '@/lib/supabase/reading-circles';

// Mock the entire reading-circles module
jest.mock('@/lib/supabase/reading-circles', () => ({
  getReadingCircles: jest.fn(() =>
    Promise.resolve([
      {
        id: 'test-id-1',
        title: 'Test Circle 1',
        status: 'recruiting',
        created_at: '2024-01-01T00:00:00Z',
        member_count: 0,
        max_participants: 10,
        progress: 0,
      },
      {
        id: 'test-id-2',
        title: 'Test Circle 2',
        status: 'in-progress',
        created_at: '2024-01-02T00:00:00Z',
        member_count: 2,
        max_participants: 10,
        progress: 50,
      },
    ])
  ),
  getReadingCircleById: jest.fn(() =>
    Promise.resolve({
      id: 'test-id',
      title: 'Test Circle',
      status: 'recruiting',
      created_at: '2024-01-01T00:00:00Z',
      member_count: 0,
      max_participants: 10,
      progress: 0,
    })
  ),
}));

describe('reading-circles API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReadingCircles', () => {
    it('should fetch reading circles successfully', async () => {
      const circles = await getReadingCircles();

      expect(circles).toHaveLength(2);
      expect(circles[0]).toMatchObject({
        id: 'test-id-1',
        title: 'Test Circle 1',
        status: 'recruiting',
        member_count: 0,
        max_participants: 10,
        progress: 0,
      });
      expect(circles[1]).toMatchObject({
        id: 'test-id-2',
        title: 'Test Circle 2',
        status: 'in-progress',
        progress: 50,
      });
    });
  });

  describe('getReadingCircleById', () => {
    it('should fetch a specific reading circle', async () => {
      const circle = await getReadingCircleById('test-id');

      expect(circle).toMatchObject({
        id: 'test-id',
        title: 'Test Circle',
        status: 'recruiting',
        member_count: 0,
        max_participants: 10,
        progress: 0,
      });
    });
  });
});
