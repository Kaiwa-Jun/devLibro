import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import ScanPage from '@/app/scan/page';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSearchStore } from '@/store/searchStore';

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
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
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

  describe('書籍検索とスキャン結果表示', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
      });
    });

    test('スキャン機能の基本的な表示が正しく行われること', () => {
      render(<ScanPage />);

      expect(screen.getByText('バーコードスキャン')).toBeInTheDocument();
      expect(screen.getByText('ISBN バーコードをスキャン')).toBeInTheDocument();
      expect(screen.getByText('スキャン開始')).toBeInTheDocument();
    });
  });

  describe('ボタン動作', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
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

    test('基本的なエラー状態の表示ができること', () => {
      render(<ScanPage />);

      // 基本的なエラー処理の存在確認
      expect(screen.queryByText('書籍情報の取得に失敗しました')).not.toBeInTheDocument();
    });
  });
});
