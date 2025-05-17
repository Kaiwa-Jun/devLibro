import { describe, expect, test } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';

// プライベート関数をテストするために、モジュール全体をインポート
import * as RakutenBooksAPI from '@/lib/api/rakuten-books';

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
fetchMock.enableMocks();

describe('楽天Books API関連の関数', () => {
  // 各テストの前にfetchモックをリセット
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // getHighResRakutenImageUrlのテスト
  describe('getHighResRakutenImageUrl', () => {
    // 注: これはプライベート関数なので直接呼び出せません
    // 代わりに、この関数を使用する公開関数をテストして間接的に検証します

    test('searchRakutenBooksByTitleを通して画像URLが高解像度化されているか確認', async () => {
      // fetchモックの設定
      fetchMock.mockResponseOnce(JSON.stringify(mockRakutenResponse));

      // APIを呼び出し
      const { books } = await RakutenBooksAPI.searchRakutenBooksByTitle({
        query: 'テスト',
        page: 1,
        hits: 20,
      });

      // 結果の確認
      expect(books.length).toBe(1);

      // 高解像度化された画像URLの確認
      // 元のURL: https://thumbnail.image.rakuten.co.jp/test.jpg
      // 期待される結果: https://thumbnail.image.rakuten.co.jp/test.jpg?_ex=600x600
      expect(books[0].img_url).toBe('https://thumbnail.image.rakuten.co.jp/test.jpg?_ex=600x600');
    });

    test('searchRakutenBookByISBNを通して画像URLが高解像度化されているか確認', async () => {
      // fetchモックの設定
      fetchMock.mockResponseOnce(JSON.stringify(mockRakutenResponse));

      // APIを呼び出し
      const book = await RakutenBooksAPI.searchRakutenBookByISBN('9784000000000');

      // 結果の確認
      expect(book).not.toBeNull();

      if (book) {
        // 高解像度化された画像URLの確認
        expect(book.img_url).toBe('https://thumbnail.image.rakuten.co.jp/test.jpg?_ex=600x600');
      }
    });
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

      fetchMock.mockResponseOnce(JSON.stringify(mockResponseWithSizedImage));

      // APIを呼び出し
      const { books } = await RakutenBooksAPI.searchRakutenBooksWithPagination('テスト', 1, 20);

      // 結果の確認
      expect(books.length).toBe(1);

      // 高解像度化された画像URLの確認 (サイズパラメータが置換されているか)
      // 元のURL: https://thumbnail.image.rakuten.co.jp/test.jpg?_ex=200x200
      // 期待される結果: https://thumbnail.image.rakuten.co.jp/test.jpg?_ex=600x600
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

      fetchMock.mockResponseOnce(JSON.stringify(mockResponseWithQueryParams));

      // APIを呼び出し
      const { books } = await RakutenBooksAPI.searchRakutenBooksWithPagination('テスト', 1, 20);

      // 結果の確認
      expect(books.length).toBe(1);

      // 高解像度化された画像URLの確認 (パラメータが追加されているか)
      // 元のURL: https://thumbnail.image.rakuten.co.jp/test.jpg?param=value
      // 期待される結果: https://thumbnail.image.rakuten.co.jp/test.jpg?param=value&_ex=600x600
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

      fetchMock.mockResponseOnce(JSON.stringify(mockResponseWithoutImage));

      // APIを呼び出し
      const { books } = await RakutenBooksAPI.searchRakutenBooksWithPagination('テスト', 1, 20);

      // 結果の確認
      expect(books.length).toBe(1);

      // プレースホルダー画像が使用されているか確認
      expect(books[0].img_url).toBe('/images/book-placeholder.png');
    });
  });

  // 楽天APIの基本的な検索機能のテスト
  describe('楽天Books APIの基本機能', () => {
    test('searchRakutenBooksByTitleが正しくBookオブジェクトを返すか確認', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(mockRakutenResponse));

      // APIを呼び出し
      const { books, totalItems, hasMore } = await RakutenBooksAPI.searchRakutenBooksByTitle({
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

    test('searchRakutenBookByISBNが正しく単一の書籍を返すか確認', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(mockRakutenResponse));

      // APIを呼び出し
      const book = await RakutenBooksAPI.searchRakutenBookByISBN('9784000000000');

      // 結果の確認
      expect(book).not.toBeNull();

      if (book) {
        expect(book.id).toBe('9784000000000');
        expect(book.title).toBe('テスト書籍');
        expect(book.author).toBe('テスト著者');
        expect(book.isbn).toBe('9784000000000');
      }
    });

    test('searchRakutenBooksWithPaginationがページネーション情報を正しく返すか確認', async () => {
      // ページネーション情報を含むモックレスポンス
      const paginatedResponse = {
        ...mockRakutenResponse,
        page: 1,
        pageCount: 3, // 3ページあると仮定
        count: 50, // 全50件あると仮定
      };

      fetchMock.mockResponseOnce(JSON.stringify(paginatedResponse));

      // APIを呼び出し
      const { books, hasMore, totalItems } = await RakutenBooksAPI.searchRakutenBooksWithPagination(
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
      const { books, hasMore, totalItems } = await RakutenBooksAPI.searchRakutenBooksWithPagination(
        'あ',
        1,
        20
      );

      // 結果の確認（APIが呼び出されず、空の結果を返すはず）
      expect(books.length).toBe(0);
      expect(hasMore).toBe(false);
      expect(totalItems).toBe(0);

      // fetchが呼び出されていないことを確認
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
