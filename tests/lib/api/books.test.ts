import {
  GoogleBooksResponse,
  searchBookByISBN,
  searchBooksByTitle,
  searchBooksWithSuggestions,
} from '@/lib/api/books';
import { searchBooksByTitleInDB } from '@/lib/supabase/books';
import { Book } from '@/types';

// モックデータ
const mockJapaneseBook: Book = {
  id: 'ja-book-123',
  isbn: '9784873117386',
  title: '日本語の書籍',
  author: '日本人著者',
  language: '日本語',
  categories: ['プログラミング'],
  img_url: '/test-image-ja.jpg',
  avg_difficulty: 3,
  description: '日本語の書籍の説明',
};

const mockEnglishBook: Book = {
  id: 'en-book-456',
  isbn: '9781449373320',
  title: 'English Book',
  author: 'English Author',
  language: 'en',
  categories: ['Programming'],
  img_url: '/test-image-en.jpg',
  avg_difficulty: 3,
  description: 'Description of an English book',
};

// Google Books APIのレスポンスをモック
const mockGoogleBooksResponse: GoogleBooksResponse = {
  items: [
    {
      id: 'ja-book-123',
      volumeInfo: {
        title: '日本語の書籍',
        authors: ['日本人著者'],
        publishedDate: '2021-01-01',
        description: '日本語の書籍の説明',
        industryIdentifiers: [
          {
            type: 'ISBN_13',
            identifier: '9784873117386',
          },
        ],
        imageLinks: {
          thumbnail: 'https://example.com/thumbnail.jpg',
          smallThumbnail: 'https://example.com/small-thumbnail.jpg',
        },
        categories: ['プログラミング'],
        language: 'ja',
      },
    },
    {
      id: 'en-book-456',
      volumeInfo: {
        title: 'English Book',
        authors: ['English Author'],
        publishedDate: '2021-01-01',
        description: 'Description of an English book',
        industryIdentifiers: [
          {
            type: 'ISBN_13',
            identifier: '9781449373320',
          },
        ],
        imageLinks: {
          thumbnail: 'https://example.com/en-thumbnail.jpg',
          smallThumbnail: 'https://example.com/en-small-thumbnail.jpg',
        },
        categories: ['Programming'],
        language: 'en',
      },
    },
  ],
  totalItems: 2,
};

// fetchのモック
global.fetch = jest.fn();

// searchBooksByTitleInDBのモック
jest.mock('@/lib/supabase/books', () => ({
  searchBooksByTitleInDB: jest.fn(),
}));

describe('書籍検索機能（日本語フィルタリング）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchBooksByTitle関数', () => {
    it('Google Books APIにlangRestrict=jaパラメータを含めたリクエストを送信する', async () => {
      // fetchのモックを設定
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockGoogleBooksResponse),
      });

      // 関数を呼び出し
      await searchBooksByTitle({ query: 'テスト' });

      // fetchが適切なパラメータで呼び出されたか確認
      expect(fetch).toHaveBeenCalledTimes(1);
      const fetchUrl = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchUrl).toContain('langRestrict=ja');
      // URLエンコードされたパラメータをチェック
      expect(fetchUrl).toContain('intitle%3A');
      expect(fetchUrl).toContain('%E3%83%86%E3%82%B9%E3%83%88'); // 'テスト'のURLエンコード
    });

    it('検索結果から日本語の書籍を返す', async () => {
      // fetchのモックを設定
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockGoogleBooksResponse),
      });

      // 関数を呼び出し
      const result = await searchBooksByTitle({ query: 'テスト' });

      // 結果に日本語の書籍が含まれていることを確認
      expect(result.books.length).toBeGreaterThan(0);
      // volumeInfo.languageが'ja'の書籍がマップされていることを確認
      expect(result.books.some(book => book.language === '日本語')).toBe(true);
    });
  });

  describe('searchBookByISBN関数', () => {
    it('Google Books APIにlangRestrict=jaパラメータを含めたリクエストを送信する', async () => {
      // fetchのモックを設定
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          items: [mockGoogleBooksResponse.items![0]], // 日本語の書籍のみ
          totalItems: 1,
        }),
      });

      // 関数を呼び出し
      await searchBookByISBN('9784873117386');

      // fetchが適切なパラメータで呼び出されたか確認
      expect(fetch).toHaveBeenCalledTimes(1);
      const fetchUrl = (fetch as jest.Mock).mock.calls[0][0] as string;
      expect(fetchUrl).toContain('langRestrict=ja');
      // URLエンコードされたパラメータをチェック
      expect(fetchUrl).toContain('isbn%3A9784873117386');
    });

    it('日本語の書籍のみを返し、その他の言語の書籍は除外する', async () => {
      // 日本語の書籍のケース
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          items: [mockGoogleBooksResponse.items![0]], // 日本語の書籍
          totalItems: 1,
        }),
      });

      const japaneseResult = await searchBookByISBN('9784873117386');
      expect(japaneseResult).not.toBeNull();
      expect(japaneseResult?.language).toBe('日本語');

      // 英語の書籍のケース
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          items: [mockGoogleBooksResponse.items![1]], // 英語の書籍
          totalItems: 1,
        }),
      });

      const englishResult = await searchBookByISBN('9781449373320');
      // 日本語以外の書籍はnullを返す
      expect(englishResult).toBeNull();
    });
  });

  describe('searchBooksWithSuggestions関数', () => {
    it('DBから取得した書籍を日本語でフィルタリングする', async () => {
      // searchBooksByTitleInDBのモックを設定
      (searchBooksByTitleInDB as jest.Mock).mockResolvedValueOnce([
        mockJapaneseBook,
        mockEnglishBook,
      ]);

      // fetchのモックを設定（Google Books API呼び出し用）
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          items: [], // APIからは結果なし
          totalItems: 0,
        }),
      });

      // 関数を呼び出し
      const result = await searchBooksWithSuggestions('テスト');

      // DB検索結果が日本語でフィルタリングされていることを確認
      expect(result.books.length).toBe(1);
      expect(result.books[0].language).toBe('日本語');
    });

    it('Google Books APIの結果を日本語でフィルタリングする', async () => {
      // searchBooksByTitleInDBのモックを設定（DBからは結果なし）
      (searchBooksByTitleInDB as jest.Mock).mockResolvedValueOnce([]);

      // fetchのモックを設定（Google Books API呼び出し用）
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockGoogleBooksResponse), // 日英両方の書籍を含む
      });

      // 関数を呼び出し
      const result = await searchBooksWithSuggestions('テスト');

      // API検索結果が日本語でフィルタリングされていることを確認
      expect(result.books.length).toBe(1);
      expect(result.books[0].language).toBe('日本語');
    });

    it('DBとAPIの両方の検索結果を結合し、日本語のみの書籍を返す', async () => {
      // searchBooksByTitleInDBのモックを設定
      (searchBooksByTitleInDB as jest.Mock).mockResolvedValueOnce([mockJapaneseBook]);

      // fetchのモックを設定（Google Books API呼び出し用）
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          items: [
            mockGoogleBooksResponse.items![1], // 英語の書籍
            {
              id: 'ja-book-789',
              volumeInfo: {
                title: '別の日本語書籍',
                authors: ['日本人著者'],
                language: 'ja',
                categories: ['プログラミング'],
                imageLinks: {
                  thumbnail: 'https://example.com/another-thumbnail.jpg',
                },
              },
            },
          ],
          totalItems: 2,
        }),
      });

      // 関数を呼び出し
      const result = await searchBooksWithSuggestions('テスト');

      // 結合した結果が日本語のみでフィルタリングされていることを確認
      expect(result.books.length).toBe(2); // DBの日本語書籍1冊 + APIの日本語書籍1冊
      expect(result.books.every(book => book.language === '日本語' || book.language === 'ja')).toBe(
        true
      );
    });
  });
});
