import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';
import NextEventCard from '@/components/reading-circles/NextEventCard';

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

const mockEvent = {
  id: '1',
  title: 'JavaScript入門輪読会',
  bookTitle: 'JavaScript: The Good Parts',
  bookCover: '/test-cover.jpg',
  date: '2024年1月15日',
  time: '19:00',
  participants: 5,
  maxParticipants: 8,
  progress: 65,
};

describe('NextEventCard', () => {
  it('renders event information correctly', () => {
    render(<NextEventCard event={mockEvent} />);

    expect(screen.getByText('JavaScript入門輪読会')).toBeInTheDocument();
    expect(screen.getByText('JavaScript: The Good Parts')).toBeInTheDocument();
    expect(screen.getByText('2024年1月15日')).toBeInTheDocument();
    expect(screen.getByText('19:00')).toBeInTheDocument();
    expect(screen.getByText('5/8名')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('renders the book cover image with correct attributes', () => {
    render(<NextEventCard event={mockEvent} />);

    const image = screen.getByAltText('JavaScript: The Good Parts');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-cover.jpg');
  });

  it('renders progress bar with correct width', () => {
    const { container } = render(<NextEventCard event={mockEvent} />);

    const progressBar = container.querySelector('[style*="width: 65%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('renders status badge correctly', () => {
    render(<NextEventCard event={mockEvent} />);

    expect(screen.getByText('次回予定')).toBeInTheDocument();
  });

  it('renders reading progress section', () => {
    render(<NextEventCard event={mockEvent} />);

    expect(screen.getByText('読書進捗')).toBeInTheDocument();
  });

  it('wraps content in a link to the event detail page', () => {
    render(<NextEventCard event={mockEvent} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/reading-circles/1');
  });

  it('applies correct styling classes', () => {
    render(<NextEventCard event={mockEvent} />);

    const card = screen.getByText('JavaScript入門輪読会').closest('.cursor-pointer');
    expect(card).toHaveClass('cursor-pointer');
  });
});
