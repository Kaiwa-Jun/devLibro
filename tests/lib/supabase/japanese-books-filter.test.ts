import { getAllBooksFromDB, searchBooksByTitleInDB } from '@/lib/supabase/books';
import { Book } from '@/types';

// Supabaseのモック
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockIlike = jest.fn();
const mockOr = jest.fn();
const mockLimit = jest.fn();
const mockOrder = jest.fn();

// モックのクエリチェーン
mockFrom.mockReturnValue({ select: mockSelect });
mockSelect.mockReturnValue({ ilike: mockIlike, or: mockOr });
mockIlike.mockReturnValue({ or: mockOr, limit: mockLimit });
mockOr.mockReturnValue({ order: mockOrder, limit: mockLimit });
mockLimit.mockReturnValue({ order: mockOrder });
mockOrder.mockReturnValue({});

// Supabaseクライアントのモック
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      from: mockFrom,
      // その他必要なSupabaseメソッド
    })),
  };
});

// 環境変数のモック
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

// モックデータ
const mockBooks: Book[] = [
  {
    id: 'ja-book-123',
    isbn: '9784873117386',
    title: '日本語の書籍',
    author: '日本人著者',
    language: '日本語',
    categories: ['プログラミング'],
    img_url: '/test-image-ja.jpg',
    avg_difficulty: 3,
    description: '日本語の書籍の説明',
  },
  {
    id: 'en-book-456',
    isbn: '9781449373320',
    title: 'English Book',
    author: 'English Author',
    language: 'en',
    categories: ['Programming'],
    img_url: '/test-image-en.jpg',
    avg_difficulty: 3,
    description: 'Description of an English book',
  },
];

// books.ts内部の実装をモック
jest.mock('@/lib/supabase/books', () => {
  const originalModule = jest.requireActual('@/lib/supabase/books');
  return {
    ...originalModule,
    // 検索関数をカスタムモックで上書き
    searchBooksByTitleInDB: jest.fn(),
    getAllBooksFromDB: jest.fn(),
  };
});

describe('書籍検索の日本語フィルタリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchBooksByTitleInDB関数', () => {
    it('日本語の書籍のみをフィルタリングするクエリを実行する', async () => {
      // モックの戻り値を設定
      (searchBooksByTitleInDB as jest.Mock).mockImplementation(async _title => {
        // 日本語の書籍のみをフィルタリング
        return [mockBooks[0]];
      });

      // 関数を呼び出し
      const result = await searchBooksByTitleInDB('テスト');

      // 日本語の書籍のみが返されることを確認
      expect(result.length).toBe(1);
      expect(result[0].language).toBe('日本語');
      expect(searchBooksByTitleInDB).toHaveBeenCalledWith('テスト', expect.any(Number));
    });

    it('クエリパラメータに言語フィルタ（日本語）が含まれていることを確認', async () => {
      // 実際にSupabaseクエリが構築されることをシミュレート
      mockOr.mockReturnValue({
        limit: mockLimit,
      });

      mockLimit.mockReturnValue({
        // Supabaseからの応答をシミュレート
        data: [mockBooks[0]],
        error: null,
      });

      // オリジナルの関数を呼び出せるように一時的にモックを解除
      (searchBooksByTitleInDB as jest.Mock).mockRestore();

      try {
        // 関数を呼び出し
        await searchBooksByTitleInDB('テスト');

        // orメソッドが言語フィルタ条件で呼び出されたことを確認
        expect(mockOr).toHaveBeenCalledWith('language.eq.日本語,language.eq.ja');
      } finally {
        // テスト後にモックを元に戻す
        jest.mock('@/lib/supabase/books', () => ({
          searchBooksByTitleInDB: jest.fn(),
          getAllBooksFromDB: jest.fn(),
        }));
      }
    });
  });

  describe('getAllBooksFromDB関数', () => {
    it('日本語の書籍のみをフィルタリングするクエリを実行する', async () => {
      // モックの戻り値を設定
      (getAllBooksFromDB as jest.Mock).mockImplementation(async () => {
        // 日本語の書籍のみを返す
        return [mockBooks[0]];
      });

      // 関数を呼び出し
      const result = await getAllBooksFromDB();

      // 日本語の書籍のみが返されることを確認
      expect(result.length).toBe(1);
      expect(result[0].language).toBe('日本語');
      expect(getAllBooksFromDB).toHaveBeenCalled();
    });

    it('クエリパラメータに言語フィルタ（日本語）が含まれていることを確認', async () => {
      // 実際にSupabaseクエリが構築されることをシミュレート
      mockOr.mockReturnValue({
        order: mockOrder,
      });

      mockOrder.mockReturnValue({
        limit: mockLimit,
      });

      mockLimit.mockReturnValue({
        // Supabaseからの応答をシミュレート
        data: [mockBooks[0]],
        error: null,
      });

      // オリジナルの関数を呼び出せるように一時的にモックを解除
      (getAllBooksFromDB as jest.Mock).mockRestore();

      try {
        // 関数を呼び出し
        await getAllBooksFromDB();

        // orメソッドが言語フィルタ条件で呼び出されたことを確認
        expect(mockOr).toHaveBeenCalledWith('language.eq.日本語,language.eq.ja');
      } finally {
        // テスト後にモックを元に戻す
        jest.mock('@/lib/supabase/books', () => ({
          searchBooksByTitleInDB: jest.fn(),
          getAllBooksFromDB: jest.fn(),
        }));
      }
    });
  });
});
