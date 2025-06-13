import { render, screen } from '@testing-library/react';

import { CircleStatusBadge } from '@/components/reading-circles/CircleStatusBadge';
import { ReadingCircle } from '@/types';

const createMockCircle = (
  status: ReadingCircle['status'],
  startDate?: string,
  endDate?: string
): ReadingCircle => ({
  id: 'test-circle-1',
  title: 'テスト輪読会',
  book_id: 1,
  created_by: 'user-1',
  status,
  max_participants: 5,
  is_private: false,
  start_date: startDate,
  end_date: endDate,
  participant_count: 3,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
});

describe('CircleStatusBadge', () => {
  it('募集中ステータスのバッジを表示する', () => {
    const circle = createMockCircle('recruiting');
    render(<CircleStatusBadge circle={circle} />);

    expect(screen.getByText('募集中')).toBeInTheDocument();
  });

  it('開催中ステータスのバッジを表示する', () => {
    const circle = createMockCircle('active');
    render(<CircleStatusBadge circle={circle} />);

    expect(screen.getByText('開催中')).toBeInTheDocument();
  });

  it('終了ステータスのバッジを表示する', () => {
    const circle = createMockCircle('completed');
    render(<CircleStatusBadge circle={circle} />);

    expect(screen.getByText('終了')).toBeInTheDocument();
  });

  it('キャンセルステータスのバッジを表示する', () => {
    const circle = createMockCircle('cancelled');
    render(<CircleStatusBadge circle={circle} />);

    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('募集前ステータスのバッジを表示する', () => {
    const circle = createMockCircle('draft');
    render(<CircleStatusBadge circle={circle} />);

    expect(screen.getByText('募集前')).toBeInTheDocument();
  });

  it('日付に基づいてリアルタイムステータスを判定する - 開始前は募集中', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const circle = createMockCircle('draft', futureDate.toISOString());
    render(<CircleStatusBadge circle={circle} />);

    expect(screen.getByText('募集中')).toBeInTheDocument();
  });

  it('カスタムクラス名が適用される', () => {
    const circle = createMockCircle('recruiting');
    render(<CircleStatusBadge circle={circle} className="custom-class" />);

    const badge = screen.getByText('募集中');
    expect(badge).toHaveClass('custom-class');
  });
});
