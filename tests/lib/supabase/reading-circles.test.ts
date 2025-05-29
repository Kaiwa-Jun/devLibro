import { getSupabaseClient } from '@/lib/supabase/client';
import {
  createReadingCircle,
  getReadingCircle,
  updateReadingCircle,
  deleteReadingCircle,
  getUserReadingCircles,
  searchPublicReadingCircles,
  joinReadingCircle,
  updateParticipantStatus,
  getCircleParticipants,
  createCircleSchedule,
  getCircleSchedules,
  updateCircleProgress,
  getUserCircleProgress,
  postCircleMessage,
  getCircleMessages,
  createCircleMeeting,
  getCircleMeetings,
} from '@/lib/supabase/reading-circles';
import { ReadingCircle, CircleParticipant, CircleSchedule, CircleProgress, CircleMessage, CircleMeeting } from '@/types';

jest.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

describe('輪読会関連の関数テスト', () => {
  let mockSupabase: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };
    
    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
  });
  
  describe('createReadingCircle', () => {
    it('輪読会を正常に作成できること', async () => {
      const mockCircleData = {
        title: 'テスト輪読会',
        book_id: '1',
        created_by: 'user-123',
        status: 'planning' as const,
        max_participants: 10,
        is_private: false,
      };
      
      const mockCreatedCircle = {
        id: 'circle-123',
        ...mockCircleData,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      
      mockSupabase.insert.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({
        data: mockCreatedCircle,
        error: null,
      });
      
      mockSupabase.from.mockImplementationOnce(() => mockSupabase);
      mockSupabase.insert.mockImplementationOnce(() => ({
        error: null,
      }));
      
      const result = await createReadingCircle(mockCircleData);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('reading_circles');
      expect(mockSupabase.insert).toHaveBeenCalledWith([mockCircleData]);
      expect(result).toEqual(mockCreatedCircle);
    });
    
    it('輪読会作成時にエラーが発生した場合はnullを返すこと', async () => {
      const mockCircleData = {
        title: 'テスト輪読会',
        book_id: '1',
        created_by: 'user-123',
        status: 'planning' as const,
        max_participants: 10,
        is_private: false,
      };
      
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('テストエラー'),
      });
      
      const result = await createReadingCircle(mockCircleData);
      
      expect(result).toBeNull();
    });
  });
  
  describe('getReadingCircle', () => {
    it('輪読会を正常に取得できること', async () => {
      const mockCircle = {
        id: 'circle-123',
        title: 'テスト輪読会',
        book_id: '1',
        book: { id: '1', title: 'テスト書籍' },
        created_by: 'user-123',
        status: 'planning',
        max_participants: 10,
        is_private: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      
      mockSupabase.single.mockResolvedValueOnce({
        data: mockCircle,
        error: null,
      });
      
      mockSupabase.from.mockImplementationOnce(() => mockSupabase);
      mockSupabase.select.mockImplementationOnce(() => mockSupabase);
      mockSupabase.eq.mockImplementationOnce(() => mockSupabase);
      mockSupabase.eq.mockImplementationOnce(() => ({
        count: 5,
        error: null,
      }));
      
      const result = await getReadingCircle('circle-123');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('reading_circles');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'circle-123');
      expect(result).toEqual({
        ...mockCircle,
        participant_count: 5,
      });
    });
    
    it('輪読会取得時にエラーが発生した場合はnullを返すこと', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('テストエラー'),
      });
      
      const result = await getReadingCircle('circle-123');
      
      expect(result).toBeNull();
    });
  });
  
  describe('updateReadingCircle', () => {
    it('輪読会を正常に更新できること', async () => {
      const mockCircleData = {
        title: '更新後の輪読会',
        status: 'active' as const,
      };
      
      const mockUpdatedCircle = {
        id: 'circle-123',
        title: '更新後の輪読会',
        book_id: '1',
        created_by: 'user-123',
        status: 'active',
        max_participants: 10,
        is_private: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      };
      
      mockSupabase.single.mockResolvedValueOnce({
        data: mockUpdatedCircle,
        error: null,
      });
      
      const result = await updateReadingCircle('circle-123', mockCircleData);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('reading_circles');
      expect(mockSupabase.update).toHaveBeenCalledWith(mockCircleData);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'circle-123');
      expect(result).toEqual(mockUpdatedCircle);
    });
    
    it('輪読会更新時にエラーが発生した場合はnullを返すこと', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('テストエラー'),
      });
      
      const result = await updateReadingCircle('circle-123', { title: '更新後の輪読会' });
      
      expect(result).toBeNull();
    });
  });
  
  describe('deleteReadingCircle', () => {
    it('輪読会を正常に削除できること', async () => {
      mockSupabase.delete.mockReturnThis();
      mockSupabase.eq.mockResolvedValueOnce({
        error: null,
      });
      
      const result = await deleteReadingCircle('circle-123');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('reading_circles');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'circle-123');
      expect(result).toBe(true);
    });
    
    it('輪読会削除時にエラーが発生した場合はfalseを返すこと', async () => {
      mockSupabase.eq.mockResolvedValueOnce({
        error: new Error('テストエラー'),
      });
      
      const result = await deleteReadingCircle('circle-123');
      
      expect(result).toBe(false);
    });
  });
  
});
