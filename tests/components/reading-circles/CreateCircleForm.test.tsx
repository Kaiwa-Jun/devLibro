import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { CreateCircleForm } from '@/components/reading-circles/CreateCircleForm';

// Next.jsルーターをモック
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// APIコールをモック
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('CreateCircleForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フォームが正常にレンダリングされること', () => {
    render(<CreateCircleForm />);

    expect(screen.getByLabelText(/読書会タイトル/)).toBeInTheDocument();
    expect(screen.getByLabelText('目的')).toBeInTheDocument();
    expect(screen.getByLabelText('説明')).toBeInTheDocument();
    expect(screen.getByText('スケジュール候補')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '読書会を作成' })).toBeInTheDocument();
  });

  it('必須項目が入力されていない場合、送信ボタンが無効になること', () => {
    render(<CreateCircleForm />);

    const submitButton = screen.getByRole('button', { name: '読書会を作成' });
    expect(submitButton).toBeDisabled();
  });

  it('タイトルを入力すると送信ボタンが有効になること', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const titleInput = screen.getByLabelText(/読書会タイトル/);
    const submitButton = screen.getByRole('button', { name: '読書会を作成' });

    await user.type(titleInput, 'テスト読書会');

    expect(submitButton).toBeEnabled();
  });

  it('タイトルが100文字を超える場合、エラーメッセージが表示されること', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const titleInput = screen.getByLabelText(/読書会タイトル/);
    const longTitle = 'a'.repeat(101);

    await user.type(titleInput, longTitle);

    expect(screen.getByText('タイトルは100文字以内で入力してください')).toBeInTheDocument();
  });

  it('説明が1000文字を超える場合、エラーメッセージが表示されること', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const descriptionInput = screen.getByLabelText('説明');
    const longDescription = 'a'.repeat(1001);

    await user.type(descriptionInput, longDescription);

    expect(screen.getByText('説明は1000文字以内で入力してください')).toBeInTheDocument();
  });

  it('スケジュール候補を追加できること', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const addScheduleButton = screen.getByRole('button', { name: 'スケジュール候補を追加' });

    await user.click(addScheduleButton);

    expect(screen.getByText('月曜日')).toBeInTheDocument();
    expect(screen.getByDisplayValue('19:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('21:00')).toBeInTheDocument();
  });

  it('スケジュール候補を削除できること', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const addScheduleButton = screen.getByRole('button', { name: 'スケジュール候補を追加' });
    await user.click(addScheduleButton);

    const deleteButton = screen.getByRole('button', { name: '削除' });
    await user.click(deleteButton);

    expect(screen.queryByText('月曜日')).not.toBeInTheDocument();
  });

  it('フォーム送信が正常に行われること', async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'bookclub-123',
        title: 'テスト読書会',
        invite_url: 'http://localhost:3000/reading-circles/join/abc123',
      }),
    } as Response);

    render(<CreateCircleForm />);

    // フォーム入力
    const titleInput = screen.getByLabelText(/読書会タイトル/);
    const purposeInput = screen.getByLabelText('目的');
    const descriptionInput = screen.getByLabelText('説明');

    await user.type(titleInput, 'テスト読書会');
    await user.type(purposeInput, 'TypeScript学習');
    await user.type(descriptionInput, 'TypeScriptの基礎を学びます');

    // スケジュール追加
    const addScheduleButton = screen.getByRole('button', { name: 'スケジュール候補を追加' });
    await user.click(addScheduleButton);

    // フォーム送信
    const submitButton = screen.getByRole('button', { name: '読書会を作成' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/reading-circles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'テスト読書会',
          purpose: 'TypeScript学習',
          description: 'TypeScriptの基礎を学びます',
          schedule_candidates: [
            {
              day_of_week: 1,
              start_time: '19:00',
              end_time: '21:00',
            },
          ],
          max_participants: 10,
          is_public: true,
          requires_approval: false,
        }),
      });
    });
  });

  it('APIエラー時にエラーメッセージが表示されること', async () => {
    const user = userEvent.setup();

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<CreateCircleForm />);

    const titleInput = screen.getByLabelText(/読書会タイトル/);
    await user.type(titleInput, 'テスト読書会');

    const submitButton = screen.getByRole('button', { name: '読書会を作成' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('読書会の作成に失敗しました')).toBeInTheDocument();
    });
  });

  it('最大参加者数を設定できること', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const maxParticipantsInput = screen.getByLabelText('最大参加者数');

    await user.clear(maxParticipantsInput);
    await user.type(maxParticipantsInput, '15');

    expect(maxParticipantsInput).toHaveValue(15);
  });

  it('プライベート読書会として設定できること', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const publicCheckbox = screen.getByLabelText('公開読書会');

    await user.click(publicCheckbox);

    expect(publicCheckbox).not.toBeChecked();
  });

  it('承認制読書会として設定できること', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const approvalCheckbox = screen.getByLabelText('参加承認制');

    await user.click(approvalCheckbox);

    expect(approvalCheckbox).toBeChecked();
  });

  it('曜日を変更できること', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const addScheduleButton = screen.getByRole('button', { name: 'スケジュール候補を追加' });
    await user.click(addScheduleButton);

    const daySelect = screen.getByDisplayValue('月曜日');
    await user.selectOptions(daySelect, '火曜日');

    expect(screen.getByDisplayValue('火曜日')).toBeInTheDocument();
  });

  it('時間を変更できること', async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    const addScheduleButton = screen.getByRole('button', { name: 'スケジュール候補を追加' });
    await user.click(addScheduleButton);

    const startTimeInput = screen.getByDisplayValue('19:00');
    await user.clear(startTimeInput);
    await user.type(startTimeInput, '20:00');

    expect(screen.getByDisplayValue('20:00')).toBeInTheDocument();
  });
});
