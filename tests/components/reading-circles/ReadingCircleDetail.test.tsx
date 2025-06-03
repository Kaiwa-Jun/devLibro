import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ReadingCircleDetail } from '@/components/reading-circles/ReadingCircleDetail';
import { ReadingCircle } from '@/types';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

global.fetch = jest.fn();

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  refresh: jest.fn(),
};

const mockCircle: ReadingCircle & {
  books?: {
    id: string;
    title: string;
    author: string;
    img_url: string;
    description?: string;
    page_count?: number;
  };
  users?: {
    id: string;
    display_name: string;
  };
  circle_participants?: {
    id: string;
    circle_id: string;
    user_id: string;
    role: 'organizer' | 'participant';
    status: 'pending' | 'approved' | 'rejected' | 'left';
    joined_at?: string;
    created_at: string;
    updated_at: string;
    users?: {
      id: string;
      display_name: string;
    };
  }[];
} = {
  id: '1',
  title: 'Test Reading Circle',
  description: 'Test description',
  book_id: 1,
  created_by: 'user1',
  status: 'recruiting',
  max_participants: 10,
  is_private: false,
  start_date: '2024-01-08T00:00:00Z',
  end_date: '2024-01-15T00:00:00Z',
  participant_count: 3,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  books: {
    id: '1',
    title: 'Test Book',
    author: 'Test Author',
    img_url: 'test.jpg',
    description: 'Test book description',
    page_count: 300,
  },
  users: {
    id: 'user1',
    display_name: 'Test Organizer',
  },
  circle_participants: [
    {
      id: '1',
      circle_id: '1',
      user_id: 'user1',
      role: 'organizer' as const,
      status: 'approved' as const,
      joined_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      users: {
        id: 'user1',
        display_name: 'Test Organizer',
      },
    },
    {
      id: '2',
      circle_id: '1',
      user_id: 'user2',
      role: 'participant' as const,
      status: 'approved' as const,
      joined_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      users: {
        id: 'user2',
        display_name: 'Test Participant',
      },
    },
  ],
};

describe('ReadingCircleDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (fetch as jest.Mock).mockClear();
  });

  it('renders circle information correctly', () => {
    render(<ReadingCircleDetail circle={mockCircle} userId="user2" />);

    expect(screen.getByText('Test Reading Circle')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('募集中')).toBeInTheDocument();
    expect(screen.getByText('公開')).toBeInTheDocument();
    expect(screen.getByText('3/10名')).toBeInTheDocument();
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('shows organizer controls for organizer', () => {
    render(<ReadingCircleDetail circle={mockCircle} userId="user1" />);

    expect(screen.getByRole('link', { name: /編集/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // Delete button with trash icon
  });

  it('shows join button for non-participants', () => {
    render(<ReadingCircleDetail circle={mockCircle} userId="user3" />);

    expect(screen.getByRole('button', { name: /参加申請/ })).toBeInTheDocument();
  });

  it('does not show join button for participants', () => {
    render(<ReadingCircleDetail circle={mockCircle} userId="user2" />);

    expect(screen.queryByRole('button', { name: /参加申請/ })).not.toBeInTheDocument();
  });

  it('handles join request successfully', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({}),
    };
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<ReadingCircleDetail circle={mockCircle} userId="user3" />);

    const joinButton = screen.getByRole('button', { name: /参加申請/ });
    await user.click(joinButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reading-circles/1/participants', {
        method: 'POST',
      });
      expect(toast.success).toHaveBeenCalledWith('参加申請を送信しました');
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it('handles join request error', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ error: 'Join failed' }),
    };
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<ReadingCircleDetail circle={mockCircle} userId="user3" />);

    const joinButton = screen.getByRole('button', { name: /参加申請/ });
    await user.click(joinButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Join failed');
    });
  });

  it('handles delete confirmation and deletion', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({}),
    };
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<ReadingCircleDetail circle={mockCircle} userId="user1" />);

    // Click delete button (trash icon)
    const deleteButton = screen.getByRole('button', { name: '' }); // Delete button with trash icon
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /削除/ });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reading-circles/1', {
        method: 'DELETE',
      });
      expect(toast.success).toHaveBeenCalledWith('輪読会を削除しました');
      expect(mockRouter.push).toHaveBeenCalledWith('/reading-circles');
    });
  });

  it('shows organizer menu for draft status', () => {
    const draftCircle = { ...mockCircle, status: 'draft' as const };
    render(<ReadingCircleDetail circle={draftCircle} userId="user1" />);

    expect(screen.getByText('主催者メニュー')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /募集開始/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /開催開始/ })).toBeInTheDocument();
  });

  it('handles status change successfully', async () => {
    const user = userEvent.setup();
    const draftCircle = { ...mockCircle, status: 'draft' as const };
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({}),
    };
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<ReadingCircleDetail circle={draftCircle} userId="user1" />);

    const recruitButton = screen.getByRole('button', { name: /募集開始/ });
    await user.click(recruitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reading-circles/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'recruiting' }),
      });
      expect(toast.success).toHaveBeenCalledWith('ステータスを更新しました');
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it('renders participants list correctly', () => {
    render(<ReadingCircleDetail circle={mockCircle} userId="user2" />);

    expect(screen.getByText('Test Organizer')).toBeInTheDocument();
    expect(screen.getByText('Test Participant')).toBeInTheDocument();
    expect(screen.getAllByText('主催者')).toHaveLength(1);
    expect(screen.getAllByText('参加者')).toHaveLength(1);
    expect(screen.getAllByText('承認済み')).toHaveLength(2);
  });
});
