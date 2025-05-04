import { searchBooksByTitleInDB } from '@/lib/supabase/books';
import { Book } from '@/types';

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

// Google Books APIからの応答型
export type GoogleBooksResponse = {
  items?: Array<{
    id: string;
    volumeInfo: {
      title: string;
      authors?: string[];
      publishedDate?: string;
      description?: string;
      industryIdentifiers?: Array<{
        type: string;
        identifier: string;
      }>;
      imageLinks?: {
        thumbnail: string;
        smallThumbnail: string;
        small?: string;
        medium?: string;
        large?: string;
        extraLarge?: string;
      };
      categories?: string[];
      language?: string;
    };
  }>;
  totalItems: number;
};

type GoogleBookItem = NonNullable<GoogleBooksResponse['items']>[number];

// Google Booksの画像URLを高解像度版に変換する関数
const getHighResImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '/images/book-placeholder.png';

  // zoom=1のサムネイルURLを高解像度に変換
  // 例: zoom=1 → zoom=3
  return imageUrl.replace('zoom=1', 'zoom=3').replace('&edge=curl', '');
};

// Google BooksのレスポンスをアプリのBook型に変換する関数
const mapGoogleBookToBook = (googleBook: GoogleBookItem): Book => {
  const { volumeInfo } = googleBook;

  // ISBNを取得
  const isbn =
    volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10')
      ?.identifier || '';

  // 言語コードを変換（必要に応じて拡張）
  const languageMap: Record<string, string> = {
    ja: '日本語',
    en: '英語',
    ko: '韓国語',
    zh: '中国語',
  };

  // サムネイル画像から高解像度の画像URLを生成
  const thumbnailUrl = volumeInfo.imageLinks?.thumbnail;
  // 高解像度版に変換
  const highResImageUrl = getHighResImageUrl(thumbnailUrl);

  return {
    id: googleBook.id,
    isbn,
    title: volumeInfo.title,
    author: volumeInfo.authors?.join(', ') || '不明',
    language: languageMap[volumeInfo.language || ''] || volumeInfo.language || 'その他',
    categories: volumeInfo.categories || [],
    img_url: highResImageUrl,
    avg_difficulty: 0, // デフォルト値
    description: volumeInfo.description || '',
  };
};

// ページネーションパラメータ型
export type SearchBooksParams = {
  query: string;
  startIndex?: number;
  maxResults?: number;
};

// タイトルによる書籍検索（ページネーション対応）
export const searchBooksByTitle = async ({
  query,
  startIndex = 0,
  maxResults = 20,
}: SearchBooksParams): Promise<{
  books: Book[];
  totalItems: number;
  hasMore: boolean;
}> => {
  try {
    console.log(
      `📚 [Google Books API] "${query}" を検索中... (開始位置: ${startIndex}, 最大結果数: ${maxResults})`
    );

    const params = new URLSearchParams({
      q: `intitle:${query}`,
      startIndex: startIndex.toString(),
      maxResults: maxResults.toString(),
    });

    if (API_KEY) {
      params.append('key', API_KEY);
    }

    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: GoogleBooksResponse = await response.json();
    const books = data.items ? data.items.map(mapGoogleBookToBook) : [];
    const totalItems = data.totalItems || 0;

    // 次のページがあるかどうかを判定
    const hasMore = startIndex + books.length < totalItems;

    console.log(
      `📗 [Google Books API] 検索結果: ${books.length}件取得 (全${totalItems}件中, 次ページ: ${hasMore ? 'あり' : 'なし'})`
    );

    return {
      books,
      totalItems,
      hasMore,
    };
  } catch (error) {
    console.error('❌ [Google Books APIエラー] 書籍検索中にエラーが発生:', error);
    return {
      books: [],
      totalItems: 0,
      hasMore: false,
    };
  }
};

// 旧API関数（互換性のために残す）
export const searchBooksByTitleLegacy = async (title: string): Promise<Book[]> => {
  const { books } = await searchBooksByTitle({ query: title });
  return books;
};

// ISBNによる書籍検索
export const searchBookByISBN = async (isbn: string): Promise<Book | null> => {
  try {
    console.log(`📘 [ISBN検索開始] ISBN "${isbn}" をGoogle Books APIで検索中...`);

    const params = new URLSearchParams({
      q: `isbn:${isbn}`,
    });

    if (API_KEY) {
      params.append('key', API_KEY);
    }

    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: GoogleBooksResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log(`ℹ️ [ISBN検索] ISBN "${isbn}" に一致する書籍は見つかりませんでした`);
      return null;
    }

    const book = mapGoogleBookToBook(data.items[0]);
    console.log(`✅ [ISBN検索成功] ISBN "${isbn}" の書籍が見つかりました: "${book.title}"`);
    return book;
  } catch (error) {
    console.error(`❌ [ISBN検索エラー] ISBN "${isbn}" の検索中にエラーが発生:`, error);
    return null;
  }
};

// Supabaseデータベースから書籍を検索する関数
export const searchBooksFromDatabase = async (title: string, limit = 10): Promise<Book[]> => {
  if (!title || title.length < 2) return [];

  try {
    const results = await searchBooksByTitleInDB(title, limit);
    console.log(`🔎 [DB検索詳細] "${title}": ${results.length}件の結果`);
    return results;
  } catch (error) {
    console.error('❌ [DB検索エラー] データベースからの検索中にエラーが発生:', error);
    return [];
  }
};

// 検索とサジェスト用の総合関数（ページネーション対応）
export const searchBooksWithSuggestions = async (
  query: string,
  startIndex = 0,
  maxResults = 20
): Promise<{
  books: Book[];
  hasMore: boolean;
  totalItems: number;
}> => {
  if (!query || query.length < 2) {
    return { books: [], hasMore: false, totalItems: 0 };
  }

  try {
    // パラメータの調整
    const apiStartIndex = startIndex > 0 ? startIndex : 0;
    const dbLimit = startIndex === 0 ? maxResults : 0; // 最初のページのみDBから取得

    let dbResults: Book[] = [];
    let dbTotal = 0;

    // 1. 最初のページの場合のみDBから検索
    if (startIndex === 0) {
      console.log(`🔍 [検索開始] "${query}" をDBで検索します...`);
      dbResults = await searchBooksFromDatabase(query);
      dbTotal = dbResults.length;
      console.log(
        `✅ [DB検索成功] "${query}" の検索結果: ${dbResults.length}件の書籍をDBから取得しました`
      );
    }

    // DBの書籍のIDをセットで保持（重複防止用）
    const existingBookIds = new Set(dbResults.map(book => book.id));

    // 2. API検索を実行
    console.log(
      `🔍 [API検索開始] "${query}" をGoogle Books APIで検索します... (開始位置: ${apiStartIndex})`
    );
    const {
      books: apiResults,
      totalItems,
      hasMore,
    } = await searchBooksByTitle({
      query,
      startIndex: apiStartIndex,
      maxResults,
    });

    if (apiResults.length > 0) {
      console.log(
        `✅ [API検索成功] "${query}" の検索結果: ${apiResults.length}件の書籍をAPIから取得しました`
      );

      // 3. 重複を除いたAPI検索結果を選別
      const newApiBooks = apiResults.filter(apiBook => !existingBookIds.has(apiBook.id));
      console.log(`✓ 重複除外後の新規API検索結果: ${newApiBooks.length}件`);

      // 4. 新しい書籍をDBに保存（バックグラウンドで処理、最初のページのみ）
      if (startIndex === 0 && newApiBooks.length > 0) {
        console.log(
          `💾 ${newApiBooks.length}件の新規書籍をDBに保存する代わりに、一時的に結果を返します...`
        );
        // DBへの自動保存を停止
        // Promise.all(newApiBooks.map(book => saveBookToDB(book))).catch(error => {
        //   console.error('❌ [DB保存エラー] 書籍のDB保存中にエラーが発生:', error);
        // });
      }

      // 5. 結果を結合して返す
      return {
        books: startIndex === 0 ? [...dbResults, ...newApiBooks] : newApiBooks,
        hasMore,
        totalItems: Math.max(dbTotal, totalItems), // DBとAPIの合計数の大きい方を使用
      };
    } else {
      console.log(`ℹ️ [API検索] "${query}" に一致する書籍はAPIに見つかりませんでした`);
      return {
        books: dbResults,
        hasMore: false,
        totalItems: dbTotal,
      };
    }
  } catch (error) {
    console.error('❌ [検索エラー] searchBooksWithSuggestionsでエラーが発生:', error);
    return { books: [], hasMore: false, totalItems: 0 };
  }
};
