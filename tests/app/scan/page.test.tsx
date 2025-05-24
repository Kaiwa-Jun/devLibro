import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import ScanPage from '@/app/scan/page';
import { useAuth } from '@/components/auth/AuthProvider';
import { searchRakutenBookByISBN } from '@/lib/api/rakuten-books';
import { saveBookToDB } from '@/lib/supabase/books';
import { useSearchStore } from '@/store/searchStore';
import { Book } from '@/types';

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
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

// ZXingライブラリのモック
jest.mock('@zxing/library', () => ({
  BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
    listVideoInputDevices: jest
      .fn()
      .mockResolvedValue([{ deviceId: 'camera1', label: 'Default Camera' }]),
    decodeFromVideoDevice: jest.fn(),
    reset: jest.fn(),
  })),
  NotFoundException: class NotFoundException extends Error {},
}));

// navigator.mediaDevices.getUserMediaのモック
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(),
  },
});

describe('ScanPage', () => {
  const mockRouter = {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockSearchStore = {
    setSearchTerm: jest.fn(),
    resetPagination: jest.fn(),
    setUseRakuten: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockBook: Book = {
    id: 'book-123',
    isbn: '9784297114626',
    title: 'プログラミング TypeScript',
    author: 'Boris Cherny',
    language: 'ja',
    categories: ['プログラミング'],
    img_url: 'https://example.com/book-image.jpg',
    avg_difficulty: 3.5,
    description: 'TypeScript入門書',
    programmingLanguages: ['TypeScript'],
    frameworks: [],
    publisherName: '出版社',
    itemUrl: 'https://example.com/item',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchStore as unknown as jest.Mock).mockReturnValue(mockSearchStore);
  });

  describe('認証チェック', () => {
    test('ログイン中の場合はローディング画面を表示すること', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      render(<ScanPage />);

      expect(screen.getByText('認証状態を確認中...')).toBeInTheDocument();
      // ローディングスピナーのアニメーションクラスで確認
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('未ログインの場合はログインページにリダイレクトすること', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      render(<ScanPage />);

      expect(mockRouter.replace).toHaveBeenCalledWith('/login?redirectFrom=scan');
    });

    test('ログイン済みの場合はスキャンページが表示されること', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      });

      render(<ScanPage />);

      expect(screen.getByText('バーコードスキャン')).toBeInTheDocument();
      expect(screen.getByText('ISBN バーコードをスキャン')).toBeInTheDocument();
      expect(screen.getByText('スキャン開始')).toBeInTheDocument();
    });
  });

  describe('スキャン機能', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      });
    });

    test('スキャン開始ボタンをクリックするとスキャンが開始されること', async () => {
      render(<ScanPage />);

      const startButton = screen.getByText('スキャン開始');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(
          screen.getByText('ISBN バーコード（13桁）をフレーム内に収めてください')
        ).toBeInTheDocument();
        expect(screen.getByText('スキャンを停止')).toBeInTheDocument();
      });
    });

    test('スキャン停止ボタンをクリックするとスキャンが停止されること', async () => {
      render(<ScanPage />);

      // スキャンを開始
      const startButton = screen.getByText('スキャン開始');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('スキャンを停止')).toBeInTheDocument();
      });

      // スキャンを停止
      const stopButton = screen.getByText('スキャンを停止');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(screen.getByText('スキャン開始')).toBeInTheDocument();
      });
    });
  });

  describe('書籍検索とスキャン結果表示', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      });
    });

    test('有効なISBNでスキャン成功時に書籍情報が表示されること', async () => {
      (searchRakutenBookByISBN as jest.Mock).mockResolvedValue(mockBook);
      (saveBookToDB as jest.Mock).mockResolvedValue(mockBook);

      render(<ScanPage />);

      // デバッグモードを有効にしてISBN検索をテスト
      const debugToggle = screen.getByText('検証');
      fireEvent.click(debugToggle);

      await waitFor(() => {
        expect(screen.getByText('検証モード')).toBeInTheDocument();
      });

      const searchButton = screen.getByText('検索');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('プログラミング TypeScript')).toBeInTheDocument();
        expect(screen.getByText('Boris Cherny')).toBeInTheDocument();
        expect(screen.getByText('詳細を見る')).toBeInTheDocument();
        expect(screen.getByText('別の本をスキャン')).toBeInTheDocument();
      });
    });

    test('書影が正しく表示されること', async () => {
      (searchRakutenBookByISBN as jest.Mock).mockResolvedValue(mockBook);
      (saveBookToDB as jest.Mock).mockResolvedValue(mockBook);

      render(<ScanPage />);

      // デバッグ検索を実行
      const debugToggle = screen.getByText('検証');
      fireEvent.click(debugToggle);

      const searchButton = screen.getByText('検索');
      fireEvent.click(searchButton);

      await waitFor(() => {
        const bookImage = screen.getByAltText('プログラミング TypeScript');
        expect(bookImage).toBeInTheDocument();
        expect(bookImage).toHaveAttribute('src', 'https://example.com/book-image.jpg');
      });
    });

    test('書籍が見つからない場合にエラーメッセージが表示されること', async () => {
      (searchRakutenBookByISBN as jest.Mock).mockResolvedValue(null);

      render(<ScanPage />);

      // デバッグ検索を実行
      const debugToggle = screen.getByText('検証');
      fireEvent.click(debugToggle);

      const searchButton = screen.getByText('検索');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(
          screen.getByText(/ISBNコード.*に該当する書籍が見つかりませんでした/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('ボタン動作', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      });
      (searchRakutenBookByISBN as jest.Mock).mockResolvedValue(mockBook);
      (saveBookToDB as jest.Mock).mockResolvedValue(mockBook);
    });

    test('詳細を見るボタンで書籍詳細ページに遷移すること', async () => {
      render(<ScanPage />);

      // 書籍をスキャン（デバッグモードで検索）
      const debugToggle = screen.getByText('検証');
      fireEvent.click(debugToggle);

      const searchButton = screen.getByText('検索');
      fireEvent.click(searchButton);

      await waitFor(() => {
        const detailButton = screen.getByText('詳細を見る');
        fireEvent.click(detailButton);

        expect(mockRouter.push).toHaveBeenCalledWith('/book/book-123');
      });
    });

    test('別の本をスキャンボタンで新しいスキャンが開始されること', async () => {
      render(<ScanPage />);

      // 書籍をスキャン（デバッグモードで検索）
      const debugToggle = screen.getByText('検証');
      fireEvent.click(debugToggle);

      const searchButton = screen.getByText('検索');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('別の本をスキャン')).toBeInTheDocument();
      });

      const newScanButton = screen.getByText('別の本をスキャン');
      fireEvent.click(newScanButton);

      // スキャン結果がクリアされ、新しいスキャンが開始されることを確認
      await waitFor(() => {
        expect(screen.queryByText('プログラミング TypeScript')).not.toBeInTheDocument();
      });
    });

    test('戻るボタンをクリックするとrouter.backが呼ばれること', () => {
      render(<ScanPage />);

      const backButton = screen.getByRole('button', { name: '' });
      fireEvent.click(backButton);

      expect(mockRouter.back).toHaveBeenCalledTimes(1);
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      });
    });

    test('API呼び出し失敗時にエラーメッセージが表示されること', async () => {
      (searchRakutenBookByISBN as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<ScanPage />);

      // デバッグ検索を実行
      const debugToggle = screen.getByText('検証');
      fireEvent.click(debugToggle);

      const searchButton = screen.getByText('検索');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(
          screen.getByText('書籍情報の取得に失敗しました。再度お試しください。')
        ).toBeInTheDocument();
      });
    });

    test('再試行ボタンでエラーをクリアできること', async () => {
      (searchRakutenBookByISBN as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<ScanPage />);

      // エラーを発生させる
      const debugToggle = screen.getByText('検証');
      fireEvent.click(debugToggle);

      const searchButton = screen.getByText('検索');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('再試行')).toBeInTheDocument();
      });

      // 再試行ボタンをクリック
      const retryButton = screen.getByText('再試行');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText('書籍情報の取得に失敗しました。')).not.toBeInTheDocument();
      });
    });
  });
});
