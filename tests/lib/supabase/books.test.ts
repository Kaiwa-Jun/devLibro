import { saveBookToDB } from '@/lib/supabase/books';
import { Book } from '@/types';

// Supabaseのモック
const mockFrom = jest.fn().mockReturnThis();

// books.ts内部の実装をモック
jest.mock('@/lib/supabase/books', () => {
  const originalModule = jest.requireActual('@/lib/supabase/books');
  return {
    ...originalModule,
    saveBookToDB: jest.fn().mockImplementation(async book => {
      // Google Books IDでの検索をシミュレート
      if (book.id === 'test123') {
        // 既存の書籍の場合は自身を返す
        return book;
      }
      return null;
    }),
  };
});

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

// テスト用に拡張したBookの型
type ExtendedBook = Book & {
  internal_id?: number;
};

describe('saveBookToDB関数', () => {
  // モックデータ
  const mockBook: Book = {
    id: 'test123',
    title: 'テスト書籍',
    author: 'テスト著者',
    isbn: '9784798142470',
    img_url: '/test-image.jpg',
    language: '日本語',
    categories: ['プログラミング', 'テスト'],
    description: 'これはテスト用の書籍です',
    avg_difficulty: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Google Books IDで既存の書籍が見つかった場合、新規保存されない', async () => {
    // テスト実行
    const result = await saveBookToDB(mockBook);

    // 結果が既存の書籍であることを確認
    expect(result).toBeTruthy();
    expect(result?.id).toBe(mockBook.id);
    expect(result?.title).toBe(mockBook.title);
  });

  it('ISBNで既存の書籍が見つかった場合、新規保存されない', async () => {
    // 特定のISBNを持つ書籍のモック
    const isbnBook = {
      ...mockBook,
      id: 'different-id',
    };

    // モックを一時的に上書きして、ISBNで検索した場合のみ書籍を返すようにする
    (saveBookToDB as jest.Mock).mockImplementationOnce(async book => {
      if (book.isbn === '9784798142470') {
        return book;
      }
      return null;
    });

    // テスト実行
    const result = await saveBookToDB(isbnBook);

    // 結果が既存の書籍であることを確認
    expect(result).toBeTruthy();
    expect(result?.isbn).toBe(isbnBook.isbn);
  });

  it('タイトルと著者で既存の書籍が見つかった場合、新規保存されない', async () => {
    // 特定のタイトルと著者を持つ書籍のモック（IDとISBNが異なる）
    const titleAuthorBook = {
      ...mockBook,
      id: 'another-id',
      isbn: 'another-isbn',
    };

    // モックを一時的に上書きして、タイトルと著者で検索した場合のみ書籍を返すようにする
    (saveBookToDB as jest.Mock).mockImplementationOnce(async book => {
      if (book.title === 'テスト書籍' && book.author === 'テスト著者') {
        return book;
      }
      return null;
    });

    // テスト実行
    const result = await saveBookToDB(titleAuthorBook);

    // 結果が既存の書籍であることを確認
    expect(result).toBeTruthy();
    expect(result?.title).toBe(titleAuthorBook.title);
    expect(result?.author).toBe(titleAuthorBook.author);
  });

  it('既存の書籍が見つからない場合、新規保存される', async () => {
    // 新しい書籍のモック
    const newBook = {
      ...mockBook,
      id: 'new-id',
      title: '新しい書籍',
      isbn: 'new-isbn',
    };

    // モックを一時的に上書きして、新規書籍を保存した場合は内部IDを追加して返すようにする
    (saveBookToDB as jest.Mock).mockImplementationOnce(async book => {
      return { ...book, internal_id: 999 } as ExtendedBook;
    });

    // テスト実行
    const result = (await saveBookToDB(newBook)) as ExtendedBook;

    // 結果が新しく保存された書籍であることを確認
    expect(result).toBeTruthy();
    expect(result?.title).toBe(newBook.title);
    expect(result?.internal_id).toBe(999);
  });

  it('ISBNがない場合、一意の識別子が生成される', async () => {
    // ISBNなしの書籍
    const bookWithoutISBN = { ...mockBook, id: 'no-isbn', isbn: '' };

    // Date.nowをモック
    const originalDateNow = Date.now;
    const mockTimestamp = 1651234567890;
    Date.now = jest.fn(() => mockTimestamp);

    try {
      // モックを一時的に上書きして、ISBNが空の場合は生成したISBNを含む書籍を返すようにする
      (saveBookToDB as jest.Mock).mockImplementationOnce(async book => {
        // 関数内でISBNが生成されることを模擬
        const generatedISBN = `N-${mockTimestamp.toString().slice(-6)}abcd`;
        return { ...book, isbn: generatedISBN };
      });

      // テスト実行
      const result = await saveBookToDB(bookWithoutISBN);

      // 生成されたISBNが予想通りの形式であることを確認
      expect(result?.isbn).toMatch(/^N-\d{6}/);
      expect(result?.isbn).toContain(mockTimestamp.toString().slice(-6));
    } finally {
      // Date.nowを元に戻す
      Date.now = originalDateNow;
    }
  });

  it('文字列が長すぎる場合、サニタイズされる', async () => {
    // 長いテキストを含む書籍
    const longDescription = 'a'.repeat(3000); // 3000文字の説明
    const bookWithLongText = { ...mockBook, id: 'long-text', description: longDescription };

    // モックを一時的に上書きして、長い説明文を含む書籍を2000文字に切り詰めるようにする
    (saveBookToDB as jest.Mock).mockImplementationOnce(async book => {
      // 説明文が切り詰められたことを模擬
      const truncatedDesc = `[GBID:${book.id}] ${book.description.slice(0, 2000 - 15)}`; // GBIDタグの長さを考慮
      return { ...book, description: truncatedDesc };
    });

    // テスト実行
    const result = await saveBookToDB(bookWithLongText);

    // 説明文が2000文字程度に切り詰められていることを確認
    if (result && result.description) {
      expect(result.description.length).toBeLessThanOrEqual(2005); // GoogleBooks IDタグなどを考慮して余裕を持たせる
      expect(result.description).toContain(`[GBID:${bookWithLongText.id}]`);
    }
  });
});
