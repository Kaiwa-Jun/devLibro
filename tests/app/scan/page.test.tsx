import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import ScanPage from '@/app/scan/page';

// モックの設定
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api/rakuten-books', () => ({
  searchRakutenBookByISBN: jest.fn(),
}));

jest.mock('@/lib/supabase/books', () => ({
  saveBookToDB: jest.fn(),
}));

// storeをモック
jest.mock('@/store/searchStore', () => ({
  useSearchStore: jest.fn(() => ({
    setSearchTerm: jest.fn(),
    resetPagination: jest.fn(),
    setUseRakuten: jest.fn(),
  })),
}));

// MediaStreamモックを作成
class MockMediaStream {
  tracks: Array<{ stop: () => void }> = [];

  constructor() {
    this.tracks = [{ stop: jest.fn() }];
  }

  getTracks() {
    return this.tracks;
  }
}

// getUserMediaモック
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(),
  },
  writable: true,
});

describe('スキャンページのテスト', () => {
  // モックのリセット
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // ルーターモックの設定
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // getUserMediaモックの設定
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(new MockMediaStream());
  });

  test('初期状態では「スキャン開始」ボタンが表示されること', () => {
    render(<ScanPage />);
    expect(screen.getByText('スキャン開始')).toBeInTheDocument();
    expect(screen.getByText('バーコードスキャン')).toBeInTheDocument();
    expect(screen.getByText('ISBN バーコードをスキャン')).toBeInTheDocument();
  });

  test('戻るボタンをクリックするとrouter.backが呼ばれること', () => {
    render(<ScanPage />);

    // 戻るボタンをクリック（SVGを含むボタン）
    const backButton = screen.getByRole('button', {
      name: '', // 空の名前で最初のボタンを取得
    });
    fireEvent.click(backButton);

    // router.backが呼ばれたことを確認
    expect(mockRouter.back).toHaveBeenCalled();
  });

  test('スキャン開始ボタンをクリックするとカメラを要求すること', () => {
    render(<ScanPage />);

    // スキャン開始ボタンをクリック
    fireEvent.click(screen.getByText('スキャン開始'));

    // getUserMediaが呼ばれたことを確認
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'environment' },
    });
  });
});
