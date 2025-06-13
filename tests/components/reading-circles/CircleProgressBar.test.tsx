import { render, screen } from '@testing-library/react';

import { CircleProgressBar } from '@/components/reading-circles/CircleProgressBar';

describe('CircleProgressBar', () => {
  it('進捗率とページ数を正しく表示する', () => {
    render(<CircleProgressBar currentProgress={50} totalPages={200} />);

    expect(screen.getByText('25% 完了')).toBeInTheDocument();
    expect(screen.getByText('50/200ページ')).toBeInTheDocument();
  });

  it('進捗率が100%を超えない', () => {
    render(<CircleProgressBar currentProgress={250} totalPages={200} />);

    expect(screen.getByText('100% 完了')).toBeInTheDocument();
    expect(screen.getByText('250/200ページ')).toBeInTheDocument();
  });

  it('進捗率が0%を下回らない', () => {
    render(<CircleProgressBar currentProgress={-10} totalPages={200} />);

    expect(screen.getByText('0% 完了')).toBeInTheDocument();
    expect(screen.getByText('-10/200ページ')).toBeInTheDocument();
  });

  it('デフォルトの総ページ数(100)が使用される', () => {
    render(<CircleProgressBar currentProgress={30} />);

    expect(screen.getByText('30% 完了')).toBeInTheDocument();
    expect(screen.getByText('30/100ページ')).toBeInTheDocument();
  });

  it('カスタムクラス名が適用される', () => {
    const { container } = render(
      <CircleProgressBar currentProgress={50} totalPages={200} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
