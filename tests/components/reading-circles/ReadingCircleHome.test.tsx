import { render, screen, waitFor } from '@testing-library/react';

import { ReadingCircleHome } from '@/components/reading-circles/ReadingCircleHome';

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'Link';
  return MockLink;
});

// Mock the reading circles client
const mockCircles = [
  {
    id: 'active-circle',
    title: '開催中の輪読会',
    book_id: 1,
    created_by: 'test-user',
    status: 'active' as const,
    max_participants: 5,
    is_private: false,
    start_date: '2024-01-01T09:00:00.000Z',
    end_date: '2024-12-31T18:00:00.000Z',
    participant_count: 3,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    books: {
      id: 'book-1',
      title: 'アクティブ技術書',
      author: 'テスト著者',
      img_url: '/active-book.jpg',
    },
  },
  {
    id: 'recruiting-circle',
    title: '募集中の輪読会',
    book_id: 2,
    created_by: 'test-user',
    status: 'recruiting' as const,
    max_participants: 8,
    is_private: false,
    start_date: '2024-12-01T09:00:00.000Z',
    participant_count: 2,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    books: {
      id: 'book-2',
      title: '募集中技術書',
      author: 'テスト著者2',
      img_url: '/recruiting-book.jpg',
    },
  },
  {
    id: 'completed-circle',
    title: '完了した輪読会',
    book_id: 3,
    created_by: 'test-user',
    status: 'completed' as const,
    max_participants: 4,
    is_private: false,
    start_date: '2024-01-01T09:00:00.000Z',
    end_date: '2024-01-31T18:00:00.000Z',
    participant_count: 4,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-31T18:00:00.000Z',
    books: {
      id: 'book-3',
      title: '完了技術書',
      author: 'テスト著者3',
      img_url: '/completed-book.jpg',
    },
  },
];

jest.mock('@/lib/supabase/reading-circles-client', () => ({
  getReadingCirclesClient: jest.fn(() => Promise.resolve(mockCircles)),
}));

describe('ReadingCircleHome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ロード中はスケルトンを表示する', () => {
    render(<ReadingCircleHome userId="test-user" />);

    // スケルトンローダーが表示されることを確認
    expect(screen.getAllByRole('status')).toHaveLength(7); // 1つのメインスケルトン + 6つのカードスケルトン
  });

  it('データ読み込み後、セクションタイトルとカウントを表示する', async () => {
    render(<ReadingCircleHome userId="test-user" />);

    await waitFor(() => {
      expect(screen.getByText('私の輪読会')).toBeInTheDocument();
      expect(screen.getByText('開催中 (1)')).toBeInTheDocument();
      expect(screen.getByText('募集中 (1)')).toBeInTheDocument();
      expect(screen.getByText('完了 (1)')).toBeInTheDocument();
    });
  });

  it('新規作成ボタンを表示する', async () => {
    render(<ReadingCircleHome userId="test-user" />);

    await waitFor(() => {
      const createButton = screen.getByText('新しい輪読会を作成');
      expect(createButton).toBeInTheDocument();
      expect(createButton.closest('a')).toHaveAttribute('href', '/reading-circles/create');
    });
  });

  it('次の予定として最も近い開始日の輪読会を表示する', async () => {
    render(<ReadingCircleHome userId="test-user" />);

    await waitFor(() => {
      expect(screen.getByText('次の予定')).toBeInTheDocument();
      // アクティブな輪読会の方が開始日が早いため、それが次の予定として表示される
      expect(screen.getByText('開催中の輪読会')).toBeInTheDocument();
    });
  });

  it('各ステータスの輪読会がそれぞれのセクションに表示される', async () => {
    render(<ReadingCircleHome userId="test-user" />);

    await waitFor(() => {
      // 開催中セクション
      expect(screen.getByText('開催中の輪読会')).toBeInTheDocument();

      // 募集中セクション
      expect(screen.getByText('募集中の輪読会')).toBeInTheDocument();

      // 完了セクション
      expect(screen.getByText('完了した輪読会')).toBeInTheDocument();
    });
  });

  it('輪読会が存在しないセクションには適切なメッセージを表示する', async () => {
    // 空の配列を返すモック
    const { getReadingCirclesClient } = await import('@/lib/supabase/reading-circles-client');
    (getReadingCirclesClient as jest.Mock).mockResolvedValueOnce([]);

    render(<ReadingCircleHome userId="test-user" />);

    await waitFor(() => {
      expect(screen.getByText('開催中の輪読会はありません')).toBeInTheDocument();
      expect(screen.getByText('募集中の輪読会はありません')).toBeInTheDocument();
      expect(screen.getByText('完了した輪読会はありません')).toBeInTheDocument();
    });
  });

  it('輪読会が存在しない場合、次の予定に適切なメッセージを表示する', async () => {
    const { getReadingCirclesClient } = await import('@/lib/supabase/reading-circles-client');
    (getReadingCirclesClient as jest.Mock).mockResolvedValueOnce([]);

    render(<ReadingCircleHome userId="test-user" />);

    await waitFor(() => {
      expect(screen.getByText('予定されている輪読会はありません')).toBeInTheDocument();
    });
  });
});
