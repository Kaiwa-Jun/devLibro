import { render, screen } from '@testing-library/react';

import MyReadingCircleCard from '@/components/reading-circles/MyReadingCircleCard';
import '@testing-library/jest-dom';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({
    alt,
    src,
    ...props
  }: {
    alt: string;
    src: string;
    [key: string]: unknown;
  }) {
    return <img alt={alt} src={src} {...props} />;
  };
});

const mockCircle = {
  id: '1',
  title: 'React実践輪読会',
  bookTitle: 'Learning React',
  bookCover: '/test-cover.jpg',
  participants: 6,
  maxParticipants: 10,
  progress: 40,
  status: 'in-progress' as const,
  nextMeetingDate: '2024/01/20',
  description: 'Reactの基礎から応用まで学ぶ輪読会です',
};

describe('MyReadingCircleCard', () => {
  it('renders circle information correctly', () => {
    render(<MyReadingCircleCard circle={mockCircle} index={0} />);

    expect(screen.getByText('React実践輪読会')).toBeInTheDocument();
    expect(screen.getByText('Learning React')).toBeInTheDocument();
    expect(screen.getByText('Reactの基礎から応用まで学ぶ輪読会です')).toBeInTheDocument();
    expect(screen.getByText('6人のメンバー')).toBeInTheDocument();
    expect(screen.getByText('2024/01/20')).toBeInTheDocument();
  });

  it('renders book cover image with correct attributes', () => {
    render(<MyReadingCircleCard circle={mockCircle} index={0} />);

    const image = screen.getByAltText('Learning React');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-cover.jpg');
  });

  it('renders status badge', () => {
    render(<MyReadingCircleCard circle={mockCircle} index={0} />);

    expect(screen.getByText('進行中')).toBeInTheDocument();
  });

  it('renders progress bar for non-recruiting circles', () => {
    render(<MyReadingCircleCard circle={mockCircle} index={0} />);

    expect(screen.getByText('読書進捗')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('does not render progress bar for recruiting circles', () => {
    const recruitingCircle = {
      ...mockCircle,
      status: 'recruiting' as const,
    };

    render(<MyReadingCircleCard circle={recruitingCircle} index={0} />);

    expect(screen.queryByText('読書進捗')).not.toBeInTheDocument();
    expect(screen.getByText('参加者募集中です 🚀')).toBeInTheDocument();
  });

  it('does not render next meeting date when not provided', () => {
    const circleWithoutDate = {
      ...mockCircle,
      nextMeetingDate: undefined,
    };

    render(<MyReadingCircleCard circle={circleWithoutDate} index={0} />);

    expect(screen.getByText('6人のメンバー')).toBeInTheDocument();
    expect(screen.queryByText('2024/01/20')).not.toBeInTheDocument();
  });

  it('wraps content in a link to the circle detail page', () => {
    render(<MyReadingCircleCard circle={mockCircle} index={0} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/reading-circles/1');
  });

  it('applies correct styling classes', () => {
    render(<MyReadingCircleCard circle={mockCircle} index={0} />);

    const card = screen.getByText('React実践輪読会').closest('.cursor-pointer');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('renders recruiting message for recruiting status', () => {
    const recruitingCircle = {
      ...mockCircle,
      status: 'recruiting' as const,
    };

    render(<MyReadingCircleCard circle={recruitingCircle} index={0} />);

    expect(screen.getByText('参加者募集中です 🚀')).toBeInTheDocument();
  });

  it('handles completed status correctly', () => {
    const completedCircle = {
      ...mockCircle,
      status: 'completed' as const,
      progress: 100,
    };

    render(<MyReadingCircleCard circle={completedCircle} index={0} />);

    expect(screen.getByText('完了済み')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.queryByText('参加者募集中です')).not.toBeInTheDocument();
  });
});
