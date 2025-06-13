import { render, screen } from '@testing-library/react';

import { NextEventCard } from '@/components/reading-circles/NextEventCard';
import { ReadingCircle } from '@/types';

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'Link';
  return MockLink;
});

const mockEvent: ReadingCircle & {
  books?: {
    id: string;
    title: string;
    author: string;
    img_url: string;
  };
} = {
  id: 'test-circle-1',
  title: 'テスト輪読会',
  book_id: 1,
  created_by: 'user-1',
  status: 'recruiting',
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
};

describe.skip('NextEventCard', () => {
  it('イベントが存在しない場合、適切なメッセージを表示する', () => {
    render(<NextEventCard />);

    expect(screen.getByText('次の予定')).toBeInTheDocument();
    expect(screen.getByText('予定されている輪読会はありません')).toBeInTheDocument();
    expect(screen.getByText('新しい輪読会を作成して仲間と学習を始めましょう')).toBeInTheDocument();
  });

  it('イベントが存在する場合、イベント情報を表示する', () => {
    render(<NextEventCard event={mockEvent} />);

    expect(screen.getByText('次の予定')).toBeInTheDocument();
    expect(screen.getByText('テスト輪読会')).toBeInTheDocument();
    expect(screen.getByText('📖 テスト技術書')).toBeInTheDocument();
    expect(screen.getByText('3/5名参加')).toBeInTheDocument();
  });

  it('書籍情報が存在する場合、書籍画像を表示する', () => {
    render(<NextEventCard event={mockEvent} />);

    const bookImage = screen.getByAltText('テスト技術書');
    expect(bookImage).toBeInTheDocument();
    expect(bookImage).toHaveAttribute('src', '/test-book.jpg');
  });

  it('日程情報を正しく表示する', () => {
    render(<NextEventCard event={mockEvent} />);

    expect(screen.getByText(/1月15日/)).toBeInTheDocument();
    expect(screen.getByText(/〜 2月15日/)).toBeInTheDocument();
  });

  it('リンクが正しく設定される', () => {
    render(<NextEventCard event={mockEvent} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/reading-circles/test-circle-1');
  });
});
