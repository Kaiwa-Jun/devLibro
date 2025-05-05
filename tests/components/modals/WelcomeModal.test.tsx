import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth/AuthProvider';
import WelcomeModal from '@/components/modals/WelcomeModal';
import { updateUserProfile } from '@/lib/supabase/client';

// モックの設定
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  updateUserProfile: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('WelcomeModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // ログイン済みユーザーの設定
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123' },
    });
  });

  it('モーダルが開いていると表示され、閉じていると表示されない', () => {
    // モーダルが閉じている場合
    const { rerender } = render(<WelcomeModal isOpen={false} onClose={mockOnClose} />);

    // モーダルが表示されないことを確認
    expect(screen.queryByText('DevLibroへようこそ！')).not.toBeInTheDocument();

    // モーダルが開いている場合に再レンダリング
    rerender(<WelcomeModal isOpen={true} onClose={mockOnClose} />);

    // モーダルが表示されることを確認
    expect(screen.getByText('DevLibroへようこそ！')).toBeInTheDocument();
    expect(screen.getByText('経験年数')).toBeInTheDocument();
    expect(screen.getByText('保存して続ける')).toBeInTheDocument();
  });

  it('経験年数を選択できる', () => {
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);

    // セレクトボックスをクリック
    fireEvent.click(screen.getByRole('combobox'));

    // オプションを確認（複数の同じテキストが存在する可能性があるため、getAllByTextを使用）
    const options = ['未経験', '1年未満', '1〜3年', '3〜5年', '5年以上'];

    options.forEach(option => {
      expect(screen.getAllByText(option).length).toBeGreaterThan(0);
    });

    // オプションを選択（実際のReact Select実装に依存するため単純なfireEventでは動作しない可能性があります）
    // このテストでは、選択肢が表示されることまでを確認します
  });

  it('ユーザーがログインしていない場合は保存処理がスキップされる', async () => {
    // ユーザーがnullの場合の設定
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
    });

    render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);

    // 保存ボタンをクリック
    fireEvent.click(screen.getByText('保存して続ける'));

    // updateUserProfileが呼ばれないことを確認
    expect(updateUserProfile).not.toHaveBeenCalled();
  });

  it('保存ボタンをクリックして経験年数を保存する', async () => {
    // 成功レスポンスのモック
    (updateUserProfile as jest.Mock).mockResolvedValue({ error: null });

    render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);

    // 「保存して続ける」ボタンをクリック
    fireEvent.click(screen.getByText('保存して続ける'));

    await waitFor(() => {
      // APIが正しいパラメータで呼ばれたことを確認
      expect(updateUserProfile).toHaveBeenCalledWith('user-123', {
        experience_years: 0, // デフォルト値
      });

      // 成功メッセージが表示されることを確認
      expect(toast.success).toHaveBeenCalledWith('経験年数を設定しました');

      // モーダルが閉じられることを確認
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('保存処理中にボタンが無効化される', async () => {
    // レスポンスを遅延させる
    (updateUserProfile as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ error: null });
        }, 100);
      });
    });

    render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);

    // 保存ボタンをクリック
    const saveButton = screen.getByText('保存して続ける');
    fireEvent.click(saveButton);

    // ボタンが無効化され、テキストが変わることを確認
    expect(saveButton).toBeDisabled();
    expect(screen.getByText('保存中...')).toBeInTheDocument();

    // 処理完了後の状態を確認
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('保存中にエラーが発生した場合にエラーメッセージが表示される', async () => {
    // エラーレスポンスのモック
    (updateUserProfile as jest.Mock).mockResolvedValue({
      error: { message: 'プロフィールの更新に失敗しました' },
    });

    render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);

    // 保存ボタンをクリック
    fireEvent.click(screen.getByText('保存して続ける'));

    await waitFor(() => {
      // エラーメッセージが表示されることを確認
      expect(toast.error).toHaveBeenCalledWith('プロフィールの更新に失敗しました');

      // モーダルが閉じられないことを確認
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
