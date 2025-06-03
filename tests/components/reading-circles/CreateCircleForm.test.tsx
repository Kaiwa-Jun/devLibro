import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { CreateCircleForm } from '@/components/reading-circles/CreateCircleForm';
import { Book } from '@/types';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/components/modals/BookSearchModal', () => ({
  BookSearchModal: ({
    isOpen,
    onClose,
    onSelect,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (book: Book) => void;
  }) => (
    <div data-testid="book-search-modal" style={{ display: isOpen ? 'block' : 'none' }}>
      <button
        onClick={() =>
          onSelect({
            id: '1',
            title: 'Test Book',
            author: 'Test Author',
            img_url: 'test.jpg',
            isbn: '1234567890',
            language: 'ja',
            categories: ['技術書'],
            description: 'Test description',
            avg_difficulty: 3,
            programmingLanguages: ['JavaScript'],
            frameworks: ['React'],
          })
        }
      >
        Select Test Book
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

global.fetch = jest.fn();

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  refresh: jest.fn(),
};

describe('CreateCircleForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (fetch as jest.Mock).mockClear();
  });

  it('renders form fields correctly', () => {
    render(<CreateCircleForm />);

    expect(screen.getByLabelText(/輪読会名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/説明/)).toBeInTheDocument();
    expect(screen.getByLabelText(/最大参加者数/)).toBeInTheDocument();
    expect(screen.getByText(/プライベート輪読会/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /書籍を選択/ })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const submitButton = screen.getByRole('button', { name: /作成/ });
    await user.click(submitButton);

    // バリデーションエラーが表示されることを確認
    // 実際のバリデーションメッセージの表示方法に応じて調整が必要
    // 現在はフォームが送信されないことを確認
    expect(fetch).not.toHaveBeenCalled();
  });

  it('opens book search modal when clicking book selection button', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const bookSelectButton = screen.getByRole('button', { name: /書籍を選択/ });
    await user.click(bookSelectButton);

    expect(screen.getByTestId('book-search-modal')).toBeVisible();
  });

  it('updates form when book is selected', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    // Open modal
    const bookSelectButton = screen.getByRole('button', { name: /書籍を選択/ });
    await user.click(bookSelectButton);

    // Select book
    const selectBookButton = screen.getByText('Select Test Book');
    await user.click(selectBookButton);

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ data: { id: '123' } }),
    };
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<CreateCircleForm />);

    // Fill form fields
    const titleInput = screen.getByLabelText(/輪読会名/);
    await user.type(titleInput, 'Test Reading Circle');

    const descriptionInput = screen.getByLabelText(/説明/);
    await user.type(descriptionInput, 'Test description');

    // Select book first
    const bookButton = screen.getByRole('button', { name: /書籍を選択/ });
    await user.click(bookButton);
    const selectBookButton = screen.getByText('Select Test Book');
    await user.click(selectBookButton);

    // Wait for book to be selected
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /作成/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/reading-circles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"title":"Test Reading Circle"'),
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('輪読会を作成しました');
    });
  });

  it('handles submission errors', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ error: 'Creation failed' }),
    };
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<CreateCircleForm />);

    // Fill minimum required data
    await user.type(screen.getByLabelText(/輪読会名/), 'Test Reading Circle');

    // Select book
    await user.click(screen.getByRole('button', { name: /書籍を選択/ }));
    await user.click(screen.getByText('Select Test Book'));

    // Wait for book selection
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    // Submit
    await user.click(screen.getByRole('button', { name: /作成/ }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Creation failed');
    });
  });

  it('calls onSuccess callback when provided', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ data: { id: '123' } }),
    };
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<CreateCircleForm onSuccess={onSuccess} />);

    // Fill form and submit
    await user.type(screen.getByLabelText(/輪読会名/), 'Test Reading Circle');

    // Select book
    await user.click(screen.getByRole('button', { name: /書籍を選択/ }));
    await user.click(screen.getByText('Select Test Book'));

    // Wait for book selection
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    // Submit
    await user.click(screen.getByRole('button', { name: /作成/ }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('123');
    });
  });
});
