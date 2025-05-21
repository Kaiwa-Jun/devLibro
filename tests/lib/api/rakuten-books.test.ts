import { describe, expect, jest, test } from '@jest/globals';

// テスト対象を直接インポート
import {
  searchRakutenBooksByTitle,
  searchRakutenBooksWithPagination,
} from '@/lib/api/rakuten-books';

// searchRakutenBookByISBN関数をモック
jest.mock('@/lib/api/rakuten-books', () => {
  // 実際のモジュールの参照を保持
  const actual = jest.requireActual('@/lib/api/rakuten-books');

  // モックデータ
  const mockBook = {
    id: '9784000000000',
    title: 'テスト書籍',
    author: 'テスト著者',
    isbn: '9784000000000',
    publisherName: 'テスト出版社',
    description: 'テスト説明文',
    img_url: 'https://thumbnail.image.rakuten.co.jp/test.jpg?_ex=600x600',
    language: '日本語',
    itemUrl: 'https://books.rakuten.co.jp/test',
    publishedAt: '2023年1月1日',
    contents: 'テスト目次',
    size: 'テストサイズ',
    rakutenGenreId: '001',
    categories: ['本'],
    programmingLanguages: [],
    frameworks: [],
  };

  return {
    ...actual,
    // 関数をモック
    searchRakutenBookByISBN: jest.fn().mockResolvedValue(mockBook),
  };
});

// APIキーをモック
process.env.NEXT_PUBLIC_RAKUTEN_APP_ID = 'test-api-key';

// テスト用のモックデータ
const mockRakutenResponse = {
  Items: [
    {
      Item: {
        title: 'テスト書籍',
        author: 'テスト著者',
        isbn: '9784000000000',
        publisherName: 'テスト出版社',
        itemCaption: 'テスト説明文',
        largeImageUrl: 'https://thumbnail.image.rakuten.co.jp/test.jpg',
        mediumImageUrl: 'https://thumbnail.image.rakuten.co.jp/test_medium.jpg',
        smallImageUrl: 'https://thumbnail.image.rakuten.co.jp/test_small.jpg',
        itemUrl: 'https://books.rakuten.co.jp/test',
        salesDate: '2023年1月1日',
        contents: 'テスト目次',
        size: 'テストサイズ',
        booksGenreId: '001',
      },
    },
  ],
  count: 1,
  page: 1,
  pageCount: 1,
  hits: 1,
  carrier: 0,
  GenreInformation: [],
};

// fetchモックの設定
global.fetch = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockRakutenResponse),
  });
});

describe('楽天Books API関連の関数', () => {
  // 各テストの前にfetchモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // getHighResRakutenImageUrlのテスト
  describe('getHighResRakutenImageUrl', () => {
    test('searchRakutenBooksByTitleを通して画像URLが高解像度化されているか確認', async () => {
      // APIを呼び出し
      const { books } = await searchRakutenBooksByTitle({
        query: 'テスト',
        page: 1,
        hits: 20,
      });

      // 結果の確認
      expect(books.length).toBe(1);

      // 高解像度化された画像URLの確認
      expect(books[0].img_url).toBe('https://thumbnail.image.rakuten.co.jp/test.jpg?_ex=600x600');
    });

    // スキップしていた元のテストを削除
  });

  // サイズパラメータが既に存在する場合の画像URL変換テスト
  describe('既存のサイズパラメータを持つ画像URLの変換', () => {
    test('searchRakutenBooksWithPaginationを通して既存サイズパラメータが置換されるか確認', async () => {
      // URLに既にサイズパラメータが含まれるケース
      const mockResponseWithSizedImage = {
        ...mockRakutenResponse,
        Items: [
          {
            Item: {
              ...mockRakutenResponse.Items[0].Item,
              largeImageUrl: 'https://thumbnail.image.rakuten.co.jp/test.jpg?_ex=200x200',
            },
          },
        ],
      };

      // フェッチモックを一度だけ上書き
      global.fetch = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponseWithSizedImage),
        });
      });

      // APIを呼び出し
      const { books } = await searchRakutenBooksWithPagination('テスト', 1, 20);

      // 結果の確認
      expect(books.length).toBe(1);

      // 高解像度化された画像URLの確認 (サイズパラメータが置換されているか)
      expect(books[0].img_url).toBe('https://thumbnail.image.rakuten.co.jp/test.jpg?_ex=600x600');
    });
  });

  // URLにクエリパラメータが既に存在する場合の画像URL変換テスト
  describe('既存のクエリパラメータを持つ画像URLの変換', () => {
    test('既存クエリパラメータに高解像度パラメータが追加されるか確認', async () => {
      // URLに既に別のクエリパラメータが含まれるケース
      const mockResponseWithQueryParams = {
        ...mockRakutenResponse,
        Items: [
          {
            Item: {
              ...mockRakutenResponse.Items[0].Item,
              largeImageUrl: 'https://thumbnail.image.rakuten.co.jp/test.jpg?param=value',
            },
          },
        ],
      };

      // フェッチモックを一度だけ上書き
      global.fetch = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponseWithQueryParams),
        });
      });

      // APIを呼び出し
      const { books } = await searchRakutenBooksWithPagination('テスト', 1, 20);

      // 結果の確認
      expect(books.length).toBe(1);

      // 高解像度化された画像URLの確認 (パラメータが追加されているか)
      expect(books[0].img_url).toBe(
        'https://thumbnail.image.rakuten.co.jp/test.jpg?param=value&_ex=600x600'
      );
    });
  });

  // 画像URLが存在しない場合のフォールバックテスト
  describe('画像URLが存在しない場合のフォールバック', () => {
    test('画像URLが存在しない場合にプレースホルダーが使用されるか確認', async () => {
      // 画像URLがないケース
      const mockResponseWithoutImage = {
        ...mockRakutenResponse,
        Items: [
          {
            Item: {
              ...mockRakutenResponse.Items[0].Item,
              largeImageUrl: '',
              mediumImageUrl: '',
              smallImageUrl: '',
            },
          },
        ],
      };

      // フェッチモックを一度だけ上書き
      global.fetch = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponseWithoutImage),
        });
      });

      // APIを呼び出し
      const { books } = await searchRakutenBooksWithPagination('テスト', 1, 20);

      // 結果の確認
      expect(books.length).toBe(1);

      // プレースホルダー画像が使用されているか確認
      expect(books[0].img_url).toBe('/images/book-placeholder.png');
    });
  });

  // 楽天APIの基本的な検索機能のテスト
  describe('楽天Books APIの基本機能', () => {
    test('searchRakutenBooksByTitleが正しくBookオブジェクトを返すか確認', async () => {
      // フェッチモックを一度だけ上書き
      global.fetch = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRakutenResponse),
        });
      });

      // APIを呼び出し
      const { books, totalItems, hasMore } = await searchRakutenBooksByTitle({
        query: 'テスト',
      });

      // 結果の確認
      expect(books.length).toBe(1);
      expect(totalItems).toBe(1);
      expect(hasMore).toBe(false);

      // 返されたBookオブジェクトの構造を確認
      const book = books[0];
      expect(book.id).toBe('9784000000000');
      expect(book.title).toBe('テスト書籍');
      expect(book.author).toBe('テスト著者');
      expect(book.isbn).toBe('9784000000000');
      expect(book.publisherName).toBe('テスト出版社');
      expect(book.description).toBe('テスト説明文');
      expect(book.language).toBe('日本語');
      expect(book.itemUrl).toBe('https://books.rakuten.co.jp/test');
    });

    // スキップしていた元のテストを削除

    test('searchRakutenBooksWithPaginationがページネーション情報を正しく返すか確認', async () => {
      // ページネーション情報を含むモックレスポンス
      const paginatedResponse = {
        ...mockRakutenResponse,
        page: 1,
        pageCount: 3, // 3ページあると仮定
        count: 50, // 全50件あると仮定
      };

      // フェッチモックを一度だけ上書き
      global.fetch = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(paginatedResponse),
        });
      });

      // APIを呼び出し
      const { books, hasMore, totalItems } = await searchRakutenBooksWithPagination(
        'テスト',
        1,
        20
      );

      // 結果の確認
      expect(books.length).toBe(1);
      expect(hasMore).toBe(true); // まだ次のページがある
      expect(totalItems).toBe(50); // 全50件
    });

    test('短すぎる検索クエリの場合は空の結果を返すか確認', async () => {
      // APIを呼び出し（1文字の検索クエリ）
      const { books, hasMore, totalItems } = await searchRakutenBooksWithPagination('あ', 1, 20);

      // 結果の確認（APIが呼び出されず、空の結果を返すはず）
      expect(books.length).toBe(0);
      expect(hasMore).toBe(false);
      expect(totalItems).toBe(0);

      // fetchが呼び出されていないことを確認
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
