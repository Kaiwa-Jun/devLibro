import { render, screen, waitFor } from '@testing-library/react';

import { useAuth } from '@/components/auth/AuthProvider';
import ExperienceCheck from '@/components/auth/ExperienceCheck';
import { getUserProfile } from '@/lib/supabase/client';

// モックの設定
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  getUserProfile: jest.fn(),
}));

jest.mock('@/components/modals/WelcomeModal', () => {
  return {
    __esModule: true,
    default: jest.fn(({ isOpen, onClose: _onClose }) => {
      return isOpen ? <div data-testid="welcome-modal">WelcomeModal</div> : null;
    }),
  };
});

describe('ExperienceCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーが未ログインの場合はモーダルを表示しない', async () => {
    // 未ログインユーザーの設定
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    render(<ExperienceCheck />);

    // モーダルが表示されないことを確認
    await waitFor(() => {
      expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument();
    });

    // getUserProfileが呼ばれないことを確認
    expect(getUserProfile).not.toHaveBeenCalled();
  });

  it('ログイン中の場合はモーダルを表示しない', async () => {
    // ロード中状態の設定
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123' },
      loading: true,
    });

    render(<ExperienceCheck />);

    // モーダルが表示されないことを確認
    await waitFor(() => {
      expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument();
    });

    // getUserProfileが呼ばれないことを確認
    expect(getUserProfile).not.toHaveBeenCalled();
  });

  it('経験年数が未設定の場合はモーダルを表示する', async () => {
    // ログイン済みユーザーの設定
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
    });

    // 経験年数が未設定のユーザープロフィール
    (getUserProfile as jest.Mock).mockResolvedValue({
      data: { id: 'user-123', experience_years: null },
      error: null,
    });

    render(<ExperienceCheck />);

    // WelcomeModalが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('welcome-modal')).toBeInTheDocument();
    });

    // getUserProfileが正しく呼ばれたことを確認
    expect(getUserProfile).toHaveBeenCalledWith('user-123');
  });

  it('経験年数が0の場合はモーダルを表示する', async () => {
    // ログイン済みユーザーの設定
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
    });

    // 経験年数が0のユーザープロフィール
    (getUserProfile as jest.Mock).mockResolvedValue({
      data: { id: 'user-123', experience_years: 0 },
      error: null,
    });

    render(<ExperienceCheck />);

    // WelcomeModalが表示されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('welcome-modal')).toBeInTheDocument();
    });
  });

  it('経験年数が設定済みの場合はモーダルを表示しない', async () => {
    // ログイン済みユーザーの設定
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
    });

    // 経験年数が設定済みのユーザープロフィール
    (getUserProfile as jest.Mock).mockResolvedValue({
      data: { id: 'user-123', experience_years: 2 },
      error: null,
    });

    render(<ExperienceCheck />);

    // モーダルが表示されないことを確認
    await waitFor(() => {
      expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument();
    });
  });

  it('プロフィール取得中にエラーが発生した場合はモーダルを表示しない', async () => {
    // ログイン済みユーザーの設定
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
    });

    // エラーレスポンスのモック
    (getUserProfile as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'エラーが発生しました' },
    });

    render(<ExperienceCheck />);

    // モーダルが表示されないことを確認
    await waitFor(() => {
      expect(screen.queryByTestId('welcome-modal')).not.toBeInTheDocument();
    });
  });
});
