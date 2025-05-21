import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import ScanPage from '@/app/scan/page';
import { useSearchStore } from '@/store/searchStore';

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api/rakuten-books', () => ({
  searchRakutenBookByISBN: jest.fn(),
}));

jest.mock('@/lib/supabase/books', () => ({
  saveBookToDB: jest.fn(),
}));

jest.mock('@/store/searchStore', () => ({
  useSearchStore: jest.fn(),
}));

describe('ScanPage', () => {
  // テスト前に各モックをリセット
  beforeEach(() => {
    jest.clearAllMocks();

    // ルーターのモック実装
    const mockRouter = {
      back: jest.fn(),
      push: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // 検索ストアのモック実装
    const mockSearchStore = {
      setSearchTerm: jest.fn(),
      resetPagination: jest.fn(),
      setUseRakuten: jest.fn(),
    };
    (useSearchStore as jest.Mock).mockReturnValue(mockSearchStore);
  });

  // 基本的なUIテストのみを実施
  test('ページタイトルと戻るボタンが表示されること', () => {
    render(<ScanPage />);

    // ページタイトルが表示されることを確認
    expect(screen.getByText('バーコードスキャン')).toBeInTheDocument();

    // 戻るボタンが表示されることを確認
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });

  test('戻るボタンをクリックするとrouter.backが呼ばれること', () => {
    render(<ScanPage />);

    // 戻るボタンをクリック - アイコンのみのボタンなのでname属性なしで取得
    const backButton = screen.getByRole('button', { name: '' });
    fireEvent.click(backButton);

    // router.backが呼ばれたか確認
    expect(useRouter().back).toHaveBeenCalledTimes(1);
  });
});
