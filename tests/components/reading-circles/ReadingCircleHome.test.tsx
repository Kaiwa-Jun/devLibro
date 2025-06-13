import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// 仮のコンポーネントパス（後で正しいパスに修正）
import ReadingCircleHome from '@/components/reading-circles/ReadingCircleHome';

// ダミーデータ
const mockCircles = [
  {
    id: '1',
    title: 'React入門読書会',
    members: 5,
    progress: 60,
    status: '進行中',
    nextEvent: '2024-07-01',
  },
  {
    id: '2',
    title: 'AI時代の読書術',
    members: 8,
    progress: 0,
    status: '募集中',
    nextEvent: '2024-07-10',
  },
  {
    id: '3',
    title: 'Web技術大全',
    members: 10,
    progress: 100,
    status: '完了',
    nextEvent: '2024-06-20',
  },
];

describe('ReadingCircleHome', () => {
  it('次回開催予定カードが表示される', () => {
    render(<ReadingCircleHome circles={mockCircles} />);
    expect(screen.getByText('次回開催予定')).toBeInTheDocument();
  });

  it('マイ読書会カードが全て表示される', () => {
    render(<ReadingCircleHome circles={mockCircles} />);
    expect(screen.getAllByText('React入門読書会').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AI時代の読書術').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Web技術大全').length).toBeGreaterThan(0);
  });

  it('進捗バーが表示される', () => {
    render(<ReadingCircleHome circles={mockCircles} />);
    expect(screen.getAllByTestId('circle-progress-bar').length).toBeGreaterThan(0);
  });

  it('ステータスバッジが表示される', () => {
    render(<ReadingCircleHome circles={mockCircles} />);
    expect(screen.getAllByText('進行中').length).toBeGreaterThan(0);
    expect(screen.getAllByText('募集中').length).toBeGreaterThan(0);
    expect(screen.getAllByText('完了').length).toBeGreaterThan(0);
  });

  it('新規作成ボタンが表示される', () => {
    render(<ReadingCircleHome circles={mockCircles} />);
    expect(screen.getByRole('button', { name: /新規作成/ })).toBeInTheDocument();
  });
});
