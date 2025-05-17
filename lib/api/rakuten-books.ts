import { Book } from '@/types';

const RAKUTEN_BOOKS_API_URL = 'https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404';
const APP_ID = process.env.NEXT_PUBLIC_RAKUTEN_APP_ID;

// 楽天API関連の型定義
export type RakutenBookItem = {
  title?: string;
  author?: string;
  publisherName?: string;
  isbn?: string;
  itemCaption?: string;
  largeImageUrl?: string;
  mediumImageUrl?: string;
  salesDate?: string;
  itemUrl?: string; // 商品詳細ページのURL
  [key: string]: unknown;
};

// 楽天APIレスポンスの型定義（実際のレスポンスに合わせて調整）
export type RakutenBooksResponse = {
  Items?: Array<{
    Item?: RakutenBookItem;
    [key: string]: unknown;
  }>;
  count?: number;
  page?: number;
  pageCount?: number;
  hits?: number;
  GenreInformation?: unknown[];
  [key: string]: unknown;
};

/**
 * タイトルで楽天ブックスAPIを検索
 */
export const searchRakutenBooksByTitle = async (title: string): Promise<Book[]> => {
  try {
    if (!APP_ID) {
      console.warn('楽天アプリIDが設定されていません');
      return [];
    }

    if (!title) return [];

    console.log(`📚 [楽天ブックスAPI] "${title}" を検索中...`);

    const params = new URLSearchParams({
      applicationId: APP_ID,
      title: title,
      hits: '20', // 最大結果数
      booksGenreId: '001', // 本
      sort: 'sales', // 売れている順
      formatVersion: '2',
    });

    const response = await fetch(`${RAKUTEN_BOOKS_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`楽天ブックスAPI エラー: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // レスポンス全体のログ出力（ただし長すぎる場合は省略）
    console.log(`📊 [楽天ブックスAPI] レスポンス:`, JSON.stringify(data).substring(0, 500) + '...');

    if (!data || !data.Items || !Array.isArray(data.Items) || data.Items.length === 0) {
      console.log(`ℹ️ [楽天ブックスAPI] "${title}" の検索結果は0件です`);
      return [];
    }

    // 楽天ブックスAPIの結果をアプリのBook型に変換
    const books: Book[] = [];

    for (const item of data.Items) {
      try {
        // itemの構造をログ出力
        console.log(
          `📖 [楽天ブックスAPI] 書籍データ:`,
          JSON.stringify(item).substring(0, 300) + '...'
        );

        // 項目がItemプロパティ内にあるパターンと直接プロパティとしてあるパターンの両方に対応
        const bookData = item.Item || item;

        if (!bookData) {
          console.log(`⚠️ [楽天ブックスAPI] 書籍データの構造が不明です:`, item);
          continue;
        }

        // 必須プロパティの確認
        const title = bookData.title || '';
        const author = bookData.author || '';
        const isbn = bookData.isbn || '';

        if (!title) {
          console.log(`⚠️ [楽天ブックスAPI] タイトルがない書籍はスキップします`);
          continue;
        }

        books.push({
          id: `rakuten-${isbn || Date.now()}`, // ISBNがなければタイムスタンプ
          isbn,
          title,
          author,
          language: '日本語', // 楽天ブックスAPIは基本的に日本の書籍
          categories: [],
          img_url: bookData.largeImageUrl || bookData.mediumImageUrl || '',
          description: bookData.itemCaption || '',
          avg_difficulty: 0, // デフォルト値
          programmingLanguages: [],
          frameworks: [],
        });
      } catch (itemError) {
        console.error(`❌ [楽天ブックスAPI] 書籍データの処理中にエラー:`, itemError);
      }
    }

    console.log(`✅ [楽天ブックスAPI] "${title}" の検索結果: ${books.length}件取得`);
    return books;
  } catch (error) {
    console.error('❌ [楽天ブックスAPIエラー] 書籍検索中にエラーが発生:', error);
    return [];
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
    if (!APP_ID) {
      console.warn('楽天アプリIDが設定されていません');
      return null;
    }

    if (!title) return null;

    console.log(`📘 [楽天ブックスAPI] "${title}" のISBNを検索中...`);

    const params = new URLSearchParams({
      applicationId: APP_ID,
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
    if (!APP_ID) {
      console.warn('楽天アプリIDが設定されていません');
      return { isbn: null, detailUrl: null };
    }

    if (!title) return { isbn: null, detailUrl: null };

    console.log(`📘 [楽天ブックスAPI] "${title}" の詳細情報を検索中...`);

    const params = new URLSearchParams({
      applicationId: APP_ID,
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

    if (!data || !data.Items || !Array.isArray(data.Items) || data.Items.length === 0) {
      console.log(`ℹ️ [楽天ブックスAPI] "${title}" に一致する書籍が見つかりませんでした`);
      return { isbn: null, detailUrl: null };
    }

    // 最初の結果から情報を抽出
    const bookItem = data.Items[0].Item || data.Items[0];

    const isbn = bookItem.isbn || null;
    const detailUrl = bookItem.itemUrl || null;

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
