import { render, screen } from '@testing-library/react';

import { MyReadingGroupsCard } from '@/components/reading-circles/MyReadingGroupsCard';
import { ReadingCircle } from '@/types';

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'Link';
  return MockLink;
});

const mockCircle: ReadingCircle & {
  books?: {
    id: string;
    title: string;
    author: string;
    img_url: string;
  };
  currentProgress?: number;
  totalPages?: number;
} = {
  id: 'test-circle-1',
  title: 'テスト輪読会',
  book_id: 1,
  created_by: 'user-1',
  status: 'active',
  max_participants: 5,
  is_private: false,
  start_date: '2024-01-15T09:00:00.000Z',
  end_date: '2024-02-15T18:00:00.000Z',
  participant_count: 3,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  books: {
    id: 'book-1',
    title: 'テスト技術書',
    author: 'テスト著者',
    img_url: '/test-book.jpg',
  },
  currentProgress: 50,
  totalPages: 200,
};

describe('MyReadingGroupsCard', () => {
  it('輪読会の基本情報を表示する', () => {
    render(<MyReadingGroupsCard circle={mockCircle} />);

    expect(screen.getByText('テスト輪読会')).toBeInTheDocument();
    expect(screen.getByText('📖 テスト技術書')).toBeInTheDocument();
    expect(screen.getByText('3/5名参加')).toBeInTheDocument();
  });

  it('ステータスバッジを表示する', () => {
    render(<MyReadingGroupsCard circle={mockCircle} />);

    // 実際に表示されるステータスを確認（日付により動的に変わる可能性があるため）
    expect(screen.getByText(/^(開催中|募集中|終了|キャンセル|募集前)$/)).toBeInTheDocument();
  });

  it('進捗バーを表示する', () => {
    render(<MyReadingGroupsCard circle={mockCircle} />);

    expect(screen.getByText('25% 完了')).toBeInTheDocument();
    expect(screen.getByText('50/200ページ')).toBeInTheDocument();
  });

  it('書籍画像を表示する', () => {
    render(<MyReadingGroupsCard circle={mockCircle} />);

    const bookImage = screen.getByAltText('テスト技術書');
    expect(bookImage).toBeInTheDocument();
    expect(bookImage).toHaveAttribute('src', '/test-book.jpg');
  });

  it('書籍情報がない場合でも正常に表示される', () => {
    const circleWithoutBook = { ...mockCircle, books: undefined };
    render(<MyReadingGroupsCard circle={circleWithoutBook} />);

    expect(screen.getByText('テスト輪読会')).toBeInTheDocument();
    expect(screen.getByText('3/5名参加')).toBeInTheDocument();
    expect(screen.queryByText('📖')).not.toBeInTheDocument();
  });

  it('進捗情報がない場合はデフォルト値を使用する', () => {
    const circleWithoutProgress = {
      ...mockCircle,
      currentProgress: undefined,
      totalPages: undefined,
    };
    render(<MyReadingGroupsCard circle={circleWithoutProgress} />);

    expect(screen.getByText('0% 完了')).toBeInTheDocument();
    expect(screen.getByText('0/100ページ')).toBeInTheDocument();
  });

  it('リンクが正しく設定される', () => {
    render(<MyReadingGroupsCard circle={mockCircle} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/reading-circles/test-circle-1');
  });
});
