import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';
import ReadingProgressBar from '@/components/reading-circles/ReadingProgressBar';

describe('ReadingProgressBar', () => {
  it('renders progress bar with correct percentage', () => {
    render(<ReadingProgressBar progress={65} />);

    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('読書進捗')).toBeInTheDocument();
  });

  it('renders without label when showLabel is false', () => {
    render(<ReadingProgressBar progress={50} showLabel={false} />);

    expect(screen.queryByText('50%')).not.toBeInTheDocument();
    expect(screen.queryByText('読書進捗')).not.toBeInTheDocument();
  });

  it('normalizes progress values correctly', () => {
    // Test negative value
    render(<ReadingProgressBar progress={-10} />);
    expect(screen.getByText('0%')).toBeInTheDocument();

    // Test value over 100
    render(<ReadingProgressBar progress={150} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<ReadingProgressBar progress={50} size="sm" />);
    expect(screen.getByText('読書進捗')).toBeInTheDocument();

    rerender(<ReadingProgressBar progress={50} size="md" />);
    expect(screen.getByText('読書進捗')).toBeInTheDocument();

    rerender(<ReadingProgressBar progress={50} size="lg" />);
    expect(screen.getByText('読書進捗')).toBeInTheDocument();
  });

  it('renders with different progress values', () => {
    const { rerender } = render(<ReadingProgressBar progress={10} />);
    expect(screen.getByText('10%')).toBeInTheDocument();

    rerender(<ReadingProgressBar progress={30} />);
    expect(screen.getByText('30%')).toBeInTheDocument();

    rerender(<ReadingProgressBar progress={50} />);
    expect(screen.getByText('50%')).toBeInTheDocument();

    rerender(<ReadingProgressBar progress={70} />);
    expect(screen.getByText('70%')).toBeInTheDocument();

    rerender(<ReadingProgressBar progress={90} />);
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(<ReadingProgressBar progress={50} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders progress bar with correct width style', () => {
    const { container } = render(<ReadingProgressBar progress={75} />);

    const progressBar = container.querySelector('[style*="width: 75%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles edge cases for progress values', () => {
    const { rerender } = render(<ReadingProgressBar progress={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();

    rerender(<ReadingProgressBar progress={100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
