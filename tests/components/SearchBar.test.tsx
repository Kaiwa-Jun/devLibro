import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import SearchBar from '@/components/home/SearchBar';
import { useSearchStore } from '@/store/searchStore';

// モックの設定
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// 検索ストアをモック
jest.mock('@/store/searchStore', () => ({
  useSearchStore: jest.fn(),
}));

describe('SearchBar Component', () => {
  // テスト前に毎回モックをリセット
  beforeEach(() => {
    jest.clearAllMocks();

    // useSearchStoreのモック実装
    const mockSetSearchTerm = jest.fn();
    const mockResetPagination = jest.fn();
    const mockClearSearch = jest.fn();

    // @ts-expect-error - モックの型を解決するために必要
    useSearchStore.mockReturnValue({
      setSearchTerm: mockSetSearchTerm,
      resetPagination: mockResetPagination,
      clearSearch: mockClearSearch,
    });
  });

  it('検索語を入力すると検索ストアの状態が更新される', async () => {
    // コンポーネントをレンダリング
    render(<SearchBar />);

    // 検索バーを取得
    const searchInput = screen.getByPlaceholderText('書籍タイトルを検索');

    // 検索語を入力
    fireEvent.change(searchInput, { target: { value: 'React' } });

    // debounceのため少し待機
    await waitFor(
      () => {
        // useSearchStoreのsetSearchTermが呼ばれることを確認
        expect(useSearchStore().setSearchTerm).toHaveBeenCalledWith('React');
      },
      { timeout: 500 } // debounceの時間より長く待機
    );
  });

  it('検索語が2文字未満の場合は検索されない', async () => {
    // コンポーネントをレンダリング
    render(<SearchBar />);

    // 検索バーを取得
    const searchInput = screen.getByPlaceholderText('書籍タイトルを検索');

    // 1文字だけ入力
    fireEvent.change(searchInput, { target: { value: 'R' } });

    // debounceのため少し待機
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400)); // debounceの時間より長く待機
    });

    // 検索語が空になることを確認（2文字未満はクリアされる）
    expect(useSearchStore().setSearchTerm).toHaveBeenCalledWith('');
  });

  it('Enterキーを押すと検索が実行される', () => {
    // コンポーネントをレンダリング
    render(<SearchBar />);

    // 検索バーを取得
    const searchInput = screen.getByPlaceholderText('書籍タイトルを検索');

    // 検索語を入力
    fireEvent.change(searchInput, { target: { value: 'JavaScript' } });

    // Enterキーを押す
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    // 検索が実行されることを確認
    expect(useSearchStore().setSearchTerm).toHaveBeenCalledWith('JavaScript');
  });

  it('クリアボタンをクリックすると検索がクリアされる', () => {
    // コンポーネントをレンダリング
    render(<SearchBar />);

    // 検索バーを取得
    const searchInput = screen.getByPlaceholderText('書籍タイトルを検索');

    // 検索語を入力
    fireEvent.change(searchInput, { target: { value: 'TypeScript' } });

    // クリアボタンが表示されるのを確認（名前ではなくクラスで特定）
    const clearButton = document.querySelector('.lucide-x');
    expect(clearButton).toBeInTheDocument();

    // クリアボタンをクリック
    fireEvent.click(clearButton as HTMLElement);

    // 検索がクリアされることを確認
    expect(useSearchStore().clearSearch).toHaveBeenCalled();
    // 入力フィールドがクリアされることを確認
    expect(searchInput).toHaveValue('');
  });
});
