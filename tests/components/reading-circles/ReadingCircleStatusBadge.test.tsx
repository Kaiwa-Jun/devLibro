import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';
import ReadingCircleStatusBadge from '@/components/reading-circles/ReadingCircleStatusBadge';

describe('ReadingCircleStatusBadge', () => {
  it('renders recruiting status correctly', () => {
    render(<ReadingCircleStatusBadge status="recruiting" />);

    expect(screen.getByText('募集中')).toBeInTheDocument();
  });

  it('renders in-progress status correctly', () => {
    render(<ReadingCircleStatusBadge status="in-progress" />);

    expect(screen.getByText('進行中')).toBeInTheDocument();
  });

  it('renders completed status correctly', () => {
    render(<ReadingCircleStatusBadge status="completed" />);

    expect(screen.getByText('完了済み')).toBeInTheDocument();
  });

  it('renders upcoming status correctly', () => {
    render(<ReadingCircleStatusBadge status="upcoming" />);

    expect(screen.getByText('開催予定')).toBeInTheDocument();
  });

  it('renders without icon when showIcon is false', () => {
    const { container } = render(<ReadingCircleStatusBadge status="recruiting" showIcon={false} />);

    expect(screen.getByText('募集中')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders with icon by default', () => {
    const { container } = render(<ReadingCircleStatusBadge status="recruiting" />);

    expect(screen.getByText('募集中')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<ReadingCircleStatusBadge status="recruiting" size="sm" />);
    expect(screen.getByText('募集中')).toBeInTheDocument();

    rerender(<ReadingCircleStatusBadge status="recruiting" size="md" />);
    expect(screen.getByText('募集中')).toBeInTheDocument();

    rerender(<ReadingCircleStatusBadge status="recruiting" size="lg" />);
    expect(screen.getByText('募集中')).toBeInTheDocument();
  });

  it('renders different status types', () => {
    const { rerender } = render(<ReadingCircleStatusBadge status="recruiting" />);
    expect(screen.getByText('募集中')).toBeInTheDocument();

    rerender(<ReadingCircleStatusBadge status="in-progress" />);
    expect(screen.getByText('進行中')).toBeInTheDocument();

    rerender(<ReadingCircleStatusBadge status="completed" />);
    expect(screen.getByText('完了済み')).toBeInTheDocument();

    rerender(<ReadingCircleStatusBadge status="upcoming" />);
    expect(screen.getByText('開催予定')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ReadingCircleStatusBadge status="recruiting" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
