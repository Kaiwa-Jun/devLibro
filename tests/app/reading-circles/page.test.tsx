import { render, screen, fireEvent } from '@testing-library/react';

import '@testing-library/jest-dom';
import ReadingCirclesPage from '@/app/reading-circles/page';

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
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ alt, src, ...props }: any) {
    return <img alt={alt} src={src} {...props} />;
  };
});

describe('ReadingCirclesPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders reading circles home component', () => {
    render(<ReadingCirclesPage />);

    expect(screen.getByText('輪読会')).toBeInTheDocument();
    expect(screen.getByText('みんなで本を読んで学びを深めよう')).toBeInTheDocument();
  });

  it('renders next event card', () => {
    render(<ReadingCirclesPage />);

    expect(screen.getByText('JavaScript入門輪読会')).toBeInTheDocument();
    expect(screen.getByText('JavaScript: The Good Parts')).toBeInTheDocument();
  });

  it('renders my reading circles', () => {
    render(<ReadingCirclesPage />);

    expect(screen.getByText('React実践輪読会')).toBeInTheDocument();
    expect(screen.getByText('TypeScript基礎輪読会')).toBeInTheDocument();
    expect(screen.getByText('Node.js実践輪読会')).toBeInTheDocument();
  });

  it('navigates to create page when create button is clicked', () => {
    render(<ReadingCirclesPage />);

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
