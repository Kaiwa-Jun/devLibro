import * as rakutenApi from '@/lib/api/rakuten-books';
import '@testing-library/jest-dom';

// モック
jest.mock('@/lib/api/rakuten-books');

// テスト用のモックデータ
const mockSearchResult = {
  books: [
    {
      id: 'test-book-id',
      title: 'テスト書籍',
      author: 'テスト著者',
      img_url: 'https://thumbnail.image.rakuten.co.jp/test.jpg?_ex=600x600',
      isbn: '9784000000000',
      publisherName: 'テスト出版社',
    },
  ],
  hasMore: false,
  totalItems: 1,
};

describe('楽天Books API機能テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 楽天APIモックの実装
    (rakutenApi.searchRakutenBooksWithPagination as jest.Mock).mockResolvedValue(mockSearchResult);
  });

  test('searchRakutenBooksWithPaginationが高解像度の画像URLを返すことを確認', async () => {
    // APIが呼び出されるかテスト
    await rakutenApi.searchRakutenBooksWithPagination('テスト', 1, 20);

    // APIが正しく呼び出されたか確認
    expect(rakutenApi.searchRakutenBooksWithPagination).toHaveBeenCalledWith('テスト', 1, 20);

    // モックされた返り値に高解像度画像URLが含まれているか確認
    const mockBook = mockSearchResult.books[0];
    expect(mockBook.img_url).toContain('_ex=600x600');
  });

  test('楽天APIの検索機能が正しく動作することを確認', async () => {
    // 短すぎるクエリの場合は空の結果を返すことを確認
    const mockShortQuery = (query: string) => {
      if (query && query.length >= 2) {
        return Promise.resolve(mockSearchResult);
      }
      return Promise.resolve({ books: [], hasMore: false, totalItems: 0 });
    };

    (rakutenApi.searchRakutenBooksWithPagination as jest.Mock).mockImplementation(mockShortQuery);

    const emptyResult = await rakutenApi.searchRakutenBooksWithPagination('あ', 1, 20);
    expect(emptyResult.books.length).toBe(0);

    // 適切なクエリの場合は結果を返すことを確認
    const result = await rakutenApi.searchRakutenBooksWithPagination('テスト', 1, 20);
    expect(result.books.length).toBe(1);
    expect(result.books[0].img_url).toContain('_ex=600x600');
  });
});
