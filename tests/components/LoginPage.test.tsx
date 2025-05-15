import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReactNode } from 'react';

import LoginPage from '@/app/login/page';
import * as client from '@/lib/supabase/client';

// モック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  signInWithEmail: jest.fn(),
  signInWithGitHub: jest.fn(),
  signInWithGoogle: jest.fn(),
  signUpWithEmail: jest.fn(),
}));

type MotionProps = {
  children: ReactNode;
  className?: string;
  _whileHover?: Record<string, unknown>;
  _transition?: Record<string, unknown>;
};

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, _whileHover, _transition, ...rest }: MotionProps) => {
      // whileHoverなどのframer-motion固有のプロパティは除外し、
      // 標準のHTML属性のみを残す
      return (
        <div className={className} {...rest}>
          {children}
        </div>
      );
    },
  },
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('LoginPage', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('本棚からのリダイレクト時、適切なメッセージを表示する', () => {
    // bookshelfからのリダイレクトをモック
    mockSearchParams.get.mockImplementation((param: string) => {
      if (param === 'redirectFrom') return 'bookshelf';
      return null;
    });

    render(<LoginPage />);

    // メッセージが表示されることを確認
    expect(
      screen.getByText('本棚を閲覧するにはログインが必要です。ログインまたは新規登録してください。')
    ).toBeInTheDocument();
  });

  it('レビューからのリダイレクト時、適切なメッセージを表示する', () => {
    // reviewからのリダイレクトをモック
    mockSearchParams.get.mockImplementation((param: string) => {
      if (param === 'redirectFrom') return 'review';
      return null;
    });

    render(<LoginPage />);

    // メッセージが表示されることを確認
    expect(
      screen.getByText(
        'レビューを投稿するにはログインが必要です。ログインまたは新規登録してください。'
      )
    ).toBeInTheDocument();
  });

  it('本棚からのログイン成功時、プロフィールページに遷移する', async () => {
    // bookshelfからのリダイレクトをモック
    mockSearchParams.get.mockImplementation((param: string) => {
      if (param === 'redirectFrom') return 'bookshelf';
      return null;
    });

    // ログイン成功をモック
    (client.signInWithEmail as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    });

    render(<LoginPage />);

    // 入力フィールドに値を入力
    fireEvent.change(screen.getByPlaceholderText('example@email.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });

    // ログインフォームのsubmitボタンをクリック
    const loginButtons = screen.getAllByText('ログイン');
    // ボタンの中からフォーム内のタイプがsubmitのものを選択
    const loginButton = loginButtons.find(
      button => button.closest('form') && button.tagName.toLowerCase() === 'button'
    );
    if (!loginButton) throw new Error('ログインボタンが見つかりません');
    fireEvent.click(loginButton);

    // プロフィールページに遷移することを確認
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/profile');
    });
  });

  it('レビューからのログイン成功時、直前のページに戻る', async () => {
    // reviewからのリダイレクトをモック
    mockSearchParams.get.mockImplementation((param: string) => {
      if (param === 'redirectFrom') return 'review';
      return null;
    });

    // ログイン成功をモック
    (client.signInWithEmail as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    });

    render(<LoginPage />);

    // 入力フィールドに値を入力
    fireEvent.change(screen.getByPlaceholderText('example@email.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });

    // ログインフォームのsubmitボタンをクリック
    const loginButtons = screen.getAllByText('ログイン');
    // ボタンの中からフォーム内のタイプがsubmitのものを選択
    const loginButton = loginButtons.find(
      button => button.closest('form') && button.tagName.toLowerCase() === 'button'
    );
    if (!loginButton) throw new Error('ログインボタンが見つかりません');
    fireEvent.click(loginButton);

    // 直前のページに戻ることを確認
    await waitFor(() => {
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });
});
