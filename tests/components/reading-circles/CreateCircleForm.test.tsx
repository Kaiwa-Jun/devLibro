import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

import { CreateCircleForm } from '@/components/reading-circles/CreateCircleForm';

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClientComponentClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({
          data: {
            session: {
              access_token: 'mock-token',
              user: { id: 'mock-user-id' },
            },
          },
        })
      ),
    },
  })),
}));

jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'mock-user-id', email: 'test@example.com' },
    loading: false,
  })),
}));

// getSupabaseSession関数のモック
const mockGetSupabaseSession = jest.fn(() => Promise.resolve('mock-token'));
jest.mock('@/lib/supabase/client', () => ({
  ...jest.requireActual('@/lib/supabase/client'),
  getSupabaseSession: mockGetSupabaseSession,
}));

const mockPush = jest.fn();
const mockFetch = jest.fn();

// グローバルfetchをモック
global.fetch = mockFetch;

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
  });
  mockFetch.mockClear();
  mockPush.mockClear();
  mockGetSupabaseSession.mockClear();
});

describe('CreateCircleForm', () => {
  it('コンポーネントが正常にレンダリングされること', () => {
    render(<CreateCircleForm />);

    expect(screen.getByText('ステップ 1: 基本情報')).toBeInTheDocument();
    expect(screen.getByLabelText(/読書会タイトル/)).toBeInTheDocument();
    expect(screen.getByLabelText('目的')).toBeInTheDocument();
    expect(screen.getByLabelText('説明')).toBeInTheDocument();
  });

  it('タイトルが100文字を超えるとエラーメッセージが表示されること', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const titleInput = screen.getByLabelText(/読書会タイトル/);
    const longTitle = 'a'.repeat(101); // 101文字

    await user.type(titleInput, longTitle);

    await waitFor(() => {
      expect(screen.getByText('タイトルは100文字以内で入力してください')).toBeInTheDocument();
    });
  });

  it('説明が1000文字を超えるとエラーメッセージが表示されること', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const descriptionInput = screen.getByLabelText('説明');
    const longDescription = 'a'.repeat(1001); // 1001文字

    await user.type(descriptionInput, longDescription);

    await waitFor(() => {
      expect(screen.getByText('説明は1000文字以内で入力してください')).toBeInTheDocument();
    });
  });

  it('必須項目が未入力の場合、次のステップに進めないこと', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    // タイトルを空のままで次へボタンをクリック
    const nextButton = screen.getByRole('button', { name: '次へ' });
    await user.click(nextButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('タイトルは必須です')).toBeInTheDocument();
    });

    // ステップ1のままであることを確認
    expect(screen.getByText('ステップ 1: 基本情報')).toBeInTheDocument();
  });

  it('フォーム送信が正常に行われること', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({
        'content-type': 'application/json',
      }),
      json: async () => ({
        id: 'bookclub-123',
        title: 'テスト読書会',
        invite_url: 'http://localhost:3000/reading-circles/join/abc123',
      }),
    } as Response);

    render(<CreateCircleForm />);

    // ステップ1: 基本情報入力
    const titleInput = screen.getByLabelText(/読書会タイトル/);
    const purposeInput = screen.getByLabelText('目的');
    const descriptionInput = screen.getByLabelText('説明');

    await user.type(titleInput, 'テスト読書会');
    await user.type(purposeInput, 'TypeScript学習');
    await user.type(descriptionInput, 'TypeScriptの基礎を学びます');

    // ステップ2に進む
    let nextButton = screen.getByRole('button', { name: '次へ' });
    await user.click(nextButton);

    // ステップ2: スケジュール設定
    await waitFor(() => {
      expect(screen.getByText('ステップ 2: スケジュール設定')).toBeInTheDocument();
    });

    // 時間帯を選択（月曜日の10時を選択）
    const mondaySlot = screen.getByRole('button', { name: '月曜日 10:00-11:00' });
    await user.click(mondaySlot);

    // ステップ3に進む
    nextButton = screen.getByRole('button', { name: '次へ' });
    await user.click(nextButton);

    // ステップ3: 確認・作成
    await waitFor(() => {
      expect(screen.getByText('ステップ 3: 確認・招待')).toBeInTheDocument();
    });

    // 読書会を作成ボタンをクリック
    const createButton = screen.getByRole('button', { name: /読書会を作成/ });
    await user.click(createButton);

    // APIが呼ばれることを確認
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/reading-circles',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('テスト読書会'),
        })
      );
    });

    // 成功後にリダイレクトされることを確認
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/reading-circles/bookclub-123');
    });
  });
});
