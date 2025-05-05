import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth/AuthProvider';
import ReviewModal from '@/components/modals/ReviewModal';
import { addReview } from '@/lib/supabase/reviews';

// モック
jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/supabase/reviews', () => ({
  addReview: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Sliderコンポーネントのモック
jest.mock('@/components/ui/slider', () => ({
  Slider: ({
    value,
    onValueChange,
    min,
    max,
    step,
    className,
  }: {
    value: number[];
    onValueChange: (value: number[]) => void;
    min: number;
    max: number;
    step: number;
    className: string;
  }) => (
    <div className={className}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={e => onValueChange([parseInt(e.target.value)])}
        data-testid="difficulty-slider"
      />
    </div>
  ),
}));

// モーションのモック
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: { children: ReactNode }) => (
      <button {...props}>{children}</button>
    ),
  },
}));

describe('ReviewModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });
  });

  it('コンポーネントが正しくレンダリングされる', () => {
    render(<ReviewModal bookId="492" onClose={mockOnClose} />);

    // タイトルと主要なUIコンポーネントが存在するか確認
    expect(screen.getByText('投稿者名')).toBeInTheDocument();
    expect(screen.getByText('難易度')).toBeInTheDocument();
    expect(screen.getByText('コメント')).toBeInTheDocument();
    expect(screen.getByText('レビューを保存')).toBeInTheDocument();
  });

  it('ユーザーが投稿タイプを切り替えられる', () => {
    render(<ReviewModal bookId="492" onClose={mockOnClose} />);

    // デフォルトでは「表示名で投稿」が選択されているはず
    const namedRadio = screen.getByLabelText('表示名で投稿');
    const anonRadio = screen.getByLabelText('匿名で投稿');

    expect(namedRadio).toBeChecked();
    expect(anonRadio).not.toBeChecked();

    // 匿名に切り替え
    fireEvent.click(anonRadio);
    expect(namedRadio).not.toBeChecked();
    expect(anonRadio).toBeChecked();
  });

  it('コメントの入力と最大文字数制限が機能する', () => {
    render(<ReviewModal bookId="492" onClose={mockOnClose} />);

    const commentTextarea = screen.getByPlaceholderText(
      '書籍の感想や難易度についてのコメントを書いてください'
    );
    expect(commentTextarea).toBeInTheDocument();

    // コメントを入力
    fireEvent.change(commentTextarea, { target: { value: 'これは素晴らしい本です！' } });
    expect(commentTextarea).toHaveValue('これは素晴らしい本です！');

    // 文字数カウンターが正しく表示される - 正規表現で検索
    const counterText = screen.getByText(/\/200/);
    expect(counterText).toBeInTheDocument();

    // 長すぎるコメントは切り詰められる (201文字のテキスト)
    const longText = 'あ'.repeat(201);
    const expectedText = 'あ'.repeat(200); // 期待される制限後のテキスト

    // テキストエリアに長いテキストを入力
    fireEvent.change(commentTextarea, { target: { value: longText } });

    // 実際のvalueではなく、Reactコンポーネントの状態を反映した値をテスト
    // (DOMのvalueはReactコンポーネントの状態から更新されるため)
    expect(commentTextarea).not.toHaveValue(longText);
    expect(commentTextarea.value.length).toBe(200);
  });

  it('未ログインユーザーがレビューを保存しようとするとエラーが表示される', () => {
    // 未ログインユーザーのモック
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
    });

    render(<ReviewModal bookId="492" onClose={mockOnClose} />);

    // コメントを入力してから保存ボタンをクリック
    const commentTextarea = screen.getByPlaceholderText(
      '書籍の感想や難易度についてのコメントを書いてください'
    );
    fireEvent.change(commentTextarea, { target: { value: 'テストレビューです' } });

    const saveButton = screen.getByText('レビューを保存');
    fireEvent.click(saveButton);

    expect(toast.error).toHaveBeenCalledWith('レビューを投稿するにはログインしてください');
    expect(addReview).not.toHaveBeenCalled();
  });

  it('コメントなしでレビューを保存しようとすると処理が中断される', () => {
    render(<ReviewModal bookId="492" onClose={mockOnClose} />);

    // 空のコメント
    const saveButton = screen.getByText('レビューを保存');
    fireEvent.click(saveButton);

    expect(addReview).not.toHaveBeenCalled();
  });

  it('レビュー保存に成功したらトーストを表示し、モーダルを閉じる', async () => {
    // 成功レスポンスのモック
    (addReview as jest.Mock).mockResolvedValue({ error: null });

    render(<ReviewModal bookId="492" onClose={mockOnClose} />);

    // コメントを入力
    const commentTextarea = screen.getByPlaceholderText(
      '書籍の感想や難易度についてのコメントを書いてください'
    );
    fireEvent.change(commentTextarea, { target: { value: 'テストレビューです' } });

    // 保存ボタンをクリック
    const saveButton = screen.getByText('レビューを保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      // APIが正しいパラメータで呼ばれたことを確認
      expect(addReview).toHaveBeenCalledWith(
        expect.objectContaining({
          bookId: '492',
          userId: 'user-123',
          comment: 'テストレビューです',
          difficulty: 3, // デフォルト値
        })
      );

      // 成功メッセージが表示されることを確認
      expect(toast.success).toHaveBeenCalledWith('レビューを保存しました');

      // モーダルが閉じられることを確認
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('レビュー保存でエラーが発生した場合、適切なエラーメッセージが表示される', async () => {
    // エラーレスポンスのモック
    (addReview as jest.Mock).mockResolvedValue({
      error: { message: 'すでにこの書籍のレビューを投稿しています' },
    });

    render(<ReviewModal bookId="492" onClose={mockOnClose} />);

    // コメントを入力
    const commentTextarea = screen.getByPlaceholderText(
      '書籍の感想や難易度についてのコメントを書いてください'
    );
    fireEvent.change(commentTextarea, { target: { value: 'テストレビューです' } });

    // 保存ボタンをクリック
    const saveButton = screen.getByText('レビューを保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      // エラーメッセージが表示されることを確認
      expect(toast.error).toHaveBeenCalledWith('すでにこの書籍のレビューを投稿しています');

      // モーダルは閉じられないことを確認
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('制約違反エラーが発生した場合の表示メッセージをテスト', async () => {
    // unique constraintエラーのモック
    (addReview as jest.Mock).mockResolvedValue({
      error: {
        message: 'duplicate key value violates unique constraint "unique_user_book_review"',
      },
    });

    render(<ReviewModal bookId="492" onClose={mockOnClose} />);

    // コメントを入力して保存
    const commentTextarea = screen.getByPlaceholderText(
      '書籍の感想や難易度についてのコメントを書いてください'
    );
    fireEvent.change(commentTextarea, { target: { value: 'テストレビューです' } });
    const saveButton = screen.getByText('レビューを保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      // わかりやすいエラーメッセージが表示されることを確認
      expect(toast.error).toHaveBeenCalledWith('すでにこの書籍のレビューを投稿しています');
    });
  });
});
