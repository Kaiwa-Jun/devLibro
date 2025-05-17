import { Book } from '@/types';

const RAKUTEN_BOOKS_API_URL = 'https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404';
const API_KEY = process.env.NEXT_PUBLIC_RAKUTEN_APP_ID;

// 楽天ブックスAPIからの応答型
export type RakutenBooksResponse = {
  Items: Array<{
    Item: {
      title: string;
      author: string;
      isbn: string;
      publisherName: string;
      itemCaption: string;
      largeImageUrl: string;
      mediumImageUrl: string;
      smallImageUrl: string;
      affiliateUrl: string;
      itemUrl: string;
      salesDate: string;
      contents: string;
      size: string;
      booksGenreId: string;
    };
  }>;
  count: number;
  page: number;
  pageCount: number;
  hits: number;
  carrier: number;
  GenreInformation: any[];
};

// ページネーションパラメータ型
export type SearchRakutenBooksParams = {
  query: string;
  page?: number;
  hits?: number;
};

// 楽天の画像URLをより高解像度に変換する関数
export function getHighResRakutenImageUrl(imageUrl: string): string {
  // nullやundefinedの場合はプレースホルダーを返す
  if (!imageUrl) {
    return '/images/book-placeholder.png';
  }

  // 既存のサイズパラメータを確認（例: ?_ex=200x200）
  const sizeParamRegex = /(\?|&)_ex=\d+x\d+/;

  // URLにクエリパラメータがあるか確認
  const hasQueryParams = imageUrl.includes('?');

  if (sizeParamRegex.test(imageUrl)) {
    // 既存のサイズパラメータを600x600に置き換え
    return imageUrl.replace(sizeParamRegex, '$1_ex=600x600');
  } else if (hasQueryParams) {
    // 他のクエリパラメータがある場合は&で追加
    return `${imageUrl}&_ex=600x600`;
  } else {
    // クエリパラメータがない場合は?で追加
    return `${imageUrl}?_ex=600x600`;
  }
}

// 楽天ブックスのレスポンスをアプリのBook型に変換する関数
const mapRakutenBookToBook = (rakutenBook: RakutenBooksResponse['Items'][number]['Item']): Book => {
  // 高解像度の画像URLを生成
  const originalImageUrl = rakutenBook.largeImageUrl || rakutenBook.mediumImageUrl;
  const highResImageUrl = getHighResRakutenImageUrl(originalImageUrl);

  return {
    id: rakutenBook.isbn, // ISBNをIDとして使用
    isbn: rakutenBook.isbn,
    title: rakutenBook.title,
    author: rakutenBook.author || '不明',
    language: '日本語', // 楽天ブックスAPIは日本語の書籍のみを提供
    categories: [], // デフォルト値（楽天APIではカテゴリ情報の形式が異なる）
    img_url: highResImageUrl || '/images/book-placeholder.png',
    avg_difficulty: 0, // デフォルト値
    description: rakutenBook.itemCaption || '',
    publisherName: rakutenBook.publisherName,
    itemUrl: rakutenBook.itemUrl,
  };
};

// タイトルによる書籍検索（ページネーション対応）
export const searchRakutenBooksByTitle = async ({
  query,
  page = 1,
  hits = 20,
}: SearchRakutenBooksParams): Promise<{
  books: Book[];
  totalItems: number;
  hasMore: boolean;
}> => {
  try {
    console.log(`📚 [楽天ブックスAPI] "${query}" を検索中... (ページ: ${page}, 表示件数: ${hits})`);

    const params = new URLSearchParams({
      format: 'json',
      title: query,
      page: page.toString(),
      hits: hits.toString(),
      applicationId: API_KEY || '',
    });

    const response = await fetch(`${RAKUTEN_BOOKS_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: RakutenBooksResponse = await response.json();
    const books = data.Items.map(item => mapRakutenBookToBook(item.Item));
    const totalItems = data.count || 0;

    // 次のページがあるかどうかを判定
    const hasMore = page < data.pageCount;

    console.log(
      `📗 [楽天ブックスAPI] 検索結果: ${books.length}件取得 (全${totalItems}件中, 次ページ: ${hasMore ? 'あり' : 'なし'})`
    );

    return {
      books,
      totalItems,
      hasMore,
    };
  } catch (error) {
    console.error('❌ [楽天ブックスAPIエラー] 書籍検索中にエラーが発生:', error);
    return {
      books: [],
      totalItems: 0,
      hasMore: false,
    };
  }
};

// ISBNによる書籍検索
export const searchRakutenBookByISBN = async (isbn: string): Promise<Book | null> => {
  try {
    console.log(`📘 [ISBN検索開始] ISBN "${isbn}" を楽天ブックスAPIで検索中...`);

    const params = new URLSearchParams({
      format: 'json',
      isbn: isbn,
      applicationId: API_KEY || '',
    });

    const response = await fetch(`${RAKUTEN_BOOKS_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: RakutenBooksResponse = await response.json();

    if (!data.Items || data.Items.length === 0) {
      console.log(`ℹ️ [ISBN検索] ISBN "${isbn}" に一致する書籍は見つかりませんでした`);
      return null;
    }

    const book = mapRakutenBookToBook(data.Items[0].Item);
    console.log(`✅ [ISBN検索成功] ISBN "${isbn}" の日本語書籍が見つかりました: "${book.title}"`);
    return book;
  } catch (error) {
    console.error(`❌ [ISBN検索エラー] ISBN "${isbn}" の検索中にエラーが発生:`, error);
    return null;
  }
};

// 検索用の総合関数（ページネーション対応）
export const searchRakutenBooksWithPagination = async (
  query: string,
  page = 1,
  hits = 20
): Promise<{
  books: Book[];
  hasMore: boolean;
  totalItems: number;
}> => {
  if (!query || query.length < 2) {
    return { books: [], hasMore: false, totalItems: 0 };
  }

  try {
    // API検索を実行
    console.log(`🔍 [API検索開始] "${query}" を楽天ブックスAPIで検索します... (ページ: ${page})`);
    const { books, totalItems, hasMore } = await searchRakutenBooksByTitle({
      query,
      page,
      hits,
    });

    if (books.length > 0) {
      console.log(
        `✅ [API検索成功] "${query}" の検索結果: ${books.length}件の書籍をAPIから取得しました`
      );

      return {
        books,
        hasMore,
        totalItems,
      };
    } else {
      console.log(`ℹ️ [API検索] "${query}" に一致する書籍はAPIに見つかりませんでした`);
      return {
        books: [],
        hasMore: false,
        totalItems: 0,
      };
    }
  } catch (error) {
    console.error('❌ [検索エラー] searchRakutenBooksWithPaginationでエラーが発生:', error);
    return { books: [], hasMore: false, totalItems: 0 };
  }
};

/**
 * 楽天ブックスAPIから書籍のISBNを抽出する関数（複数の構造パターンに対応）
 */
function extractIsbnFromRakutenResponse(data: Record<string, unknown>): string | null {
  try {
    // データがない場合
    if (!data) return null;

    // レスポンスをログに出力（最初の部分だけ）
    console.log(
      `📝 [楽天ブックスAPI] ISBN抽出用データ:`,
      JSON.stringify(data).substring(0, 300) + '...'
    );

    // パターン1: Items[0].Item.isbn
    if (data.Items && Array.isArray(data.Items) && data.Items.length > 0) {
      const firstItem = data.Items[0] as Record<string, unknown>;

      // パターン1-1: Items[0].Item.isbn
      if (firstItem.Item && typeof firstItem.Item === 'object' && firstItem.Item !== null) {
        const item = firstItem.Item as Record<string, unknown>;
        if (item.isbn && typeof item.isbn === 'string') {
          console.log(`✓ [楽天ブックスAPI] パターン1-1で見つかりました: ${item.isbn}`);
          return item.isbn;
        }
      }

      // パターン1-2: Items[0].isbn (直接プロパティ)
      if (firstItem.isbn && typeof firstItem.isbn === 'string') {
        console.log(`✓ [楽天ブックスAPI] パターン1-2で見つかりました: ${firstItem.isbn}`);
        return firstItem.isbn;
      }

      // データ構造を詳細に調査してログ出力
      console.log(`🔍 [楽天ブックスAPI] 最初のアイテムの構造:`, firstItem);

      // パターン1-3: 他のプロパティを探索
      for (const key in firstItem) {
        const value = firstItem[key];

        // オブジェクトであれば内部を探索
        if (value && typeof value === 'object' && value !== null) {
          const objValue = value as Record<string, unknown>;
          // isbn直接プロパティ
          if (objValue.isbn && typeof objValue.isbn === 'string') {
            console.log(`✓ [楽天ブックスAPI] パターン1-3で見つかりました: ${objValue.isbn}`);
            return objValue.isbn;
          }

          // ISBNという名前のプロパティ（大文字小文字問わず）
          for (const subKey in objValue) {
            if (
              subKey.toLowerCase() === 'isbn' &&
              objValue[subKey] &&
              typeof objValue[subKey] === 'string'
            ) {
              console.log(`✓ [楽天ブックスAPI] パターン1-4で見つかりました: ${objValue[subKey]}`);
              return objValue[subKey] as string;
            }
          }
        }
      }
    }

    // パターン2: データ全体を探索
    const searchForIsbn = (obj: Record<string, unknown>, depth = 0): string | null => {
      if (depth > 5) return null; // 再帰の深さ制限

      if (!obj || typeof obj !== 'object') return null;

      // isbnプロパティを直接検索
      if (obj.isbn && typeof obj.isbn === 'string') {
        console.log(`✓ [楽天ブックスAPI] 再帰検索で見つかりました: ${obj.isbn}`);
        return obj.isbn;
      }

      // ISBNという名前のプロパティ（大文字小文字問わず）を検索
      for (const key in obj) {
        if (key.toLowerCase() === 'isbn' && obj[key] && typeof obj[key] === 'string') {
          console.log(`✓ [楽天ブックスAPI] キー検索で見つかりました: ${obj[key]}`);
          return obj[key] as string;
        }

        // 再帰的に探索
        if (obj[key] && typeof obj[key] === 'object' && obj[key] !== null) {
          const result = searchForIsbn(obj[key] as Record<string, unknown>, depth + 1);
          if (result) return result;
        }
      }

      return null;
    };

    const recursiveResult = searchForIsbn(data);
    if (recursiveResult) return recursiveResult;

    // どの方法でも見つからなかった場合
    console.log(`❓ [楽天ブックスAPI] ISBNが見つかりませんでした`);
    return null;
  } catch (error) {
    console.error(`❌ [楽天ブックスAPI] ISBN抽出中にエラー:`, error);
    return null;
  }
}

/**
 * Google Books IDを使って楽天ブックスAPIを検索し、ISBNを取得する
 * Google Books APIでISBNが取得できない場合のフォールバックとして使用
 */
export const searchRakutenBookByTitle = async (title: string): Promise<string | null> => {
  try {
    if (!API_KEY) {
      console.warn('楽天アプリIDが設定されていません');
      return null;
    }

    if (!title) return null;

    console.log(`📘 [楽天ブックスAPI] "${title}" のISBNを検索中...`);

    const params = new URLSearchParams({
      applicationId: API_KEY,
      title: title,
      hits: '1', // 最初の1件だけで十分
      booksGenreId: '001', // 本
      sort: 'sales', // 売れている順
      formatVersion: '2',
    });

    const response = await fetch(`${RAKUTEN_BOOKS_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`楽天ブックスAPI エラー: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // レスポンスの構造を確認
    console.log(
      `📊 [楽天ブックスAPI] レスポンス確認:`,
      JSON.stringify(data).substring(0, 300) + '...'
    );

    // ISBN抽出処理
    const isbn = extractIsbnFromRakutenResponse(data);

    if (isbn) {
      console.log(`✅ [楽天ブックスAPI] "${title}" のISBN: ${isbn}`);
      return isbn;
    }

    console.log(`ℹ️ [楽天ブックスAPI] "${title}" に一致する書籍のISBNが見つかりませんでした`);
    return null;
  } catch (error) {
    console.error(`❌ [楽天ブックスAPIエラー] "${title}" のISBN検索中にエラーが発生:`, error);
    return null;
  }
};

/**
 * 楽天ブックスAPIから特定タイトルの書籍の詳細情報を取得
 * 詳細ページURLも取得できるようにするため
 */
export const getRakutenBookDetailByTitle = async (
  title: string
): Promise<{ isbn: string | null; detailUrl: string | null }> => {
  try {
    if (!API_KEY) {
      console.warn('楽天アプリIDが設定されていません');
      return { isbn: null, detailUrl: null };
    }

    if (!title) return { isbn: null, detailUrl: null };

    console.log(`📘 [楽天ブックスAPI] "${title}" の詳細情報を検索中...`);

    const params = new URLSearchParams({
      applicationId: API_KEY,
      title: title,
      hits: '1', // 最初の1件だけで十分
      booksGenreId: '001', // 本
      sort: 'sales', // 売れている順
      formatVersion: '2',
    });

    console.log(`📘 [楽天ブックスAPI] 完全なURLパラメータ: ${params.toString()}`);
    const requestUrl = `${RAKUTEN_BOOKS_API_URL}?${params.toString()}`;
    console.log(`📘 [楽天ブックスAPI] リクエストURL: ${requestUrl}`);

    const response = await fetch(requestUrl);

    if (!response.ok) {
      console.error(`📘 [楽天ブックスAPI] HTTPエラー: ${response.status} ${response.statusText}`);
      throw new Error(`楽天ブックスAPI エラー: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // レスポンスの構造を確認
    console.log(
      `📊 [楽天ブックスAPI] レスポンス確認:`,
      JSON.stringify(data).substring(0, 500) + '...'
    );

    if (!data || !data.Items || !Array.isArray(data.Items) || data.Items.length === 0) {
      console.log(`ℹ️ [楽天ブックスAPI] "${title}" に一致する書籍が見つかりませんでした`);
      return { isbn: null, detailUrl: null };
    }

    // 最初の結果から情報を抽出
    const itemContainer = data.Items[0];
    console.log(`📘 [楽天ブックスAPI] 最初のアイテム:`, itemContainer);

    // 項目がItemプロパティ内にあるパターンと直接プロパティとしてあるパターンの両方に対応
    const bookItem = itemContainer.Item || itemContainer;
    console.log(`📘 [楽天ブックスAPI] 書籍データ:`, bookItem);

    const isbn = bookItem.isbn || null;
    const detailUrl = bookItem.itemUrl || null;

    console.log(`📘 [楽天ブックスAPI] 抽出された情報 - ISBN: ${isbn}, 詳細URL: ${detailUrl}`);

    if (isbn || detailUrl) {
      console.log(`✅ [楽天ブックスAPI] "${title}" の詳細情報: ISBN=${isbn}, URL=${detailUrl}`);
    } else {
      console.log(`⚠️ [楽天ブックスAPI] "${title}" の詳細情報が取得できませんでした`);
    }

    return { isbn, detailUrl };
  } catch (error) {
    console.error(`❌ [楽天ブックスAPIエラー] "${title}" の詳細情報検索中にエラーが発生:`, error);
    return { isbn: null, detailUrl: null };
  }
};
