import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ReadingCirclesPage from '@/app/reading-circles/page';
import '@testing-library/jest-dom';

// Mock sample data for reading circles
const mockReadingCircles = [
  {
    id: '1',
    title: 'JavaScript入門輪読会',
    description: 'JavaScript: The Good Parts',
    status: 'in-progress' as const,
    member_count: 6,
    max_participants: 10,
    progress: 75,
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'React実践輪読会',
    description: 'Reactの基礎から応用まで',
    status: 'recruiting' as const,
    member_count: 3,
    max_participants: 8,
    progress: 0,
    created_at: '2024-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    title: 'TypeScript基礎輪読会',
    description: 'TypeScriptを学ぼう',
    status: 'in-progress' as const,
    member_count: 5,
    max_participants: 8,
    progress: 45,
    created_at: '2024-01-03T00:00:00.000Z',
  },
  {
    id: '4',
    title: 'Node.js実践輪読会',
    description: 'サーバーサイド開発',
    status: 'completed' as const,
    member_count: 7,
    max_participants: 10,
    progress: 100,
    created_at: '2024-01-04T00:00:00.000Z',
  },
];

// Mock Supabase
jest.mock('@/lib/supabase/reading-circles', () => ({
  getReadingCircles: jest.fn(() => Promise.resolve(mockReadingCircles)),
  getUserReadingCircles: jest.fn(() => Promise.resolve(mockReadingCircles)),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    section: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <section {...props}>{children}</section>
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

describe('ReadingCirclesPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders reading circles home component', async () => {
    render(<ReadingCirclesPage />);

    await waitFor(() => {
      expect(screen.getByText('輪読会')).toBeInTheDocument();
    });
    expect(screen.getByText('みんなで本を読んで学びを深めよう ✨')).toBeInTheDocument();
  });

  it('renders next event card', async () => {
    render(<ReadingCirclesPage />);

    await waitFor(() => {
      expect(screen.getAllByText('JavaScript入門輪読会')[0]).toBeInTheDocument();
    });
  });

  it('renders my reading circles', async () => {
    render(<ReadingCirclesPage />);

    await waitFor(() => {
      expect(screen.getAllByText('React実践輪読会')[0]).toBeInTheDocument();
    });
    expect(screen.getAllByText('TypeScript基礎輪読会')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Node.js実践輪読会')[0]).toBeInTheDocument();
  });

  it('navigates to create page when create button is clicked', async () => {
    render(<ReadingCirclesPage />);

    await waitFor(() => {
      expect(screen.getByText('輪読会')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /新規作成/ });
    fireEvent.click(createButton);

    expect(mockPush).toHaveBeenCalledWith('/reading-circles/create');
  });

  it('renders with proper layout classes', () => {
    const { container } = render(<ReadingCirclesPage />);

    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('min-h-screen', 'bg-background', 'pt-16', 'pb-16', 'md:pb-0');
  });
});
