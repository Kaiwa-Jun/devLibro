import { fireEvent, render, screen } from '@testing-library/react';

import ReadingCirclesHome from '@/components/reading-circles/ReadingCirclesHome';
import '@testing-library/jest-dom';

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

const mockNextEvent = {
  id: '1',
  title: 'JavaScript入門輪読会',
  bookTitle: 'JavaScript: The Good Parts',
  bookCover: '/test-cover.jpg',
  date: '2024/01/15',
  time: '19:00',
  participants: 5,
  maxParticipants: 8,
  progress: 65,
};

const mockCircles = [
  {
    id: '1',
    title: 'React実践輪読会',
    bookTitle: 'Learning React',
    bookCover: '/test-cover-1.jpg',
    participants: 6,
    maxParticipants: 10,
    progress: 40,
    status: 'in-progress' as const,
    nextMeetingDate: '2024/01/20',
    description: 'Reactの基礎から応用まで学ぶ輪読会です',
  },
  {
    id: '2',
    title: 'TypeScript基礎輪読会',
    bookTitle: 'Programming TypeScript',
    bookCover: '/test-cover-2.jpg',
    participants: 3,
    maxParticipants: 6,
    progress: 0,
    status: 'recruiting' as const,
    description: 'TypeScriptの型システムを学ぶ輪読会です',
  },
  {
    id: '3',
    title: 'Node.js実践輪読会',
    bookTitle: 'Node.js Design Patterns',
    bookCover: '/test-cover-3.jpg',
    participants: 4,
    maxParticipants: 8,
    progress: 100,
    status: 'completed' as const,
    description: 'Node.jsの設計パターンを学んだ輪読会です',
  },
];

describe('ReadingCirclesHome', () => {
  const mockOnCreateCircle = jest.fn();

  beforeEach(() => {
    mockOnCreateCircle.mockClear();
  });

  it('renders the main title and description', () => {
    render(<ReadingCirclesHome myCircles={mockCircles} onCreateCircle={mockOnCreateCircle} />);

    expect(screen.getByText('輪読会')).toBeInTheDocument();
    expect(screen.getByText('みんなで本を読んで学びを深めよう ✨')).toBeInTheDocument();
  });

  it('renders create button and calls onCreateCircle when clicked', () => {
    render(<ReadingCirclesHome myCircles={mockCircles} onCreateCircle={mockOnCreateCircle} />);

    const createButton = screen.getByRole('button', { name: /新規作成/ });
    expect(createButton).toBeInTheDocument();

    fireEvent.click(createButton);
    expect(mockOnCreateCircle).toHaveBeenCalledTimes(1);
  });

  it('renders next event card when nextEvent is provided', () => {
    render(
      <ReadingCirclesHome
        nextEvent={mockNextEvent}
        myCircles={mockCircles}
        onCreateCircle={mockOnCreateCircle}
      />
    );

    expect(screen.getByText('次回予定 🎯')).toBeInTheDocument(); // セクションタイトル
    expect(screen.getByText('JavaScript入門輪読会')).toBeInTheDocument();
    expect(screen.getByText('JavaScript: The Good Parts')).toBeInTheDocument();
  });

  it('does not render next event section when nextEvent is not provided', () => {
    render(<ReadingCirclesHome myCircles={mockCircles} onCreateCircle={mockOnCreateCircle} />);

    expect(screen.queryByText('次回予定 🎯')).not.toBeInTheDocument();
  });

  it('renders my reading circles section with tabs', () => {
    render(<ReadingCirclesHome myCircles={mockCircles} onCreateCircle={mockOnCreateCircle} />);

    expect(screen.getByText('マイ輪読会 📚')).toBeInTheDocument();
    expect(screen.getByText('すべて (3)')).toBeInTheDocument();
    expect(screen.getByText('進行中 (1)')).toBeInTheDocument();
    expect(screen.getByText('募集中 (1)')).toBeInTheDocument();
    expect(screen.getByText('完了済み (1)')).toBeInTheDocument();
  });

  it('renders all circles by default', () => {
    render(<ReadingCirclesHome myCircles={mockCircles} onCreateCircle={mockOnCreateCircle} />);

    expect(screen.getByText('React実践輪読会')).toBeInTheDocument();
    expect(screen.getByText('TypeScript基礎輪読会')).toBeInTheDocument();
    expect(screen.getByText('Node.js実践輪読会')).toBeInTheDocument();
  });

  it('shows tabs with correct counts', () => {
    render(<ReadingCirclesHome myCircles={mockCircles} onCreateCircle={mockOnCreateCircle} />);

    expect(screen.getByRole('tab', { name: '進行中 (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '募集中 (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '完了済み (1)' })).toBeInTheDocument();
  });

  it('shows empty state when no circles exist', () => {
    render(<ReadingCirclesHome myCircles={[]} onCreateCircle={mockOnCreateCircle} />);

    expect(screen.getByText('まだ参加している輪読会がありません')).toBeInTheDocument();
    expect(
      screen.getByText('新しい輪読会を作成するか、既存の輪読会に参加してみましょう 🚀')
    ).toBeInTheDocument();

    const createButton = screen.getByRole('button', { name: /最初の輪読会を作成/ });
    fireEvent.click(createButton);
    expect(mockOnCreateCircle).toHaveBeenCalledTimes(1);
  });
});
