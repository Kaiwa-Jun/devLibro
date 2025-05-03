import { saveBookToDB, searchBooksByTitleInDB } from '@/lib/supabase/books';
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
export const searchBooksFromDatabase = async (title: string): Promise<Book[]> => {
  if (!title || title.length < 2) return [];

  try {
    const results = await searchBooksByTitleInDB(title);
    console.log(`🔎 [DB検索詳細] "${title}": ${results.length}件の結果`);
    return results;
  } catch (error) {
    console.error('❌ [DB検索エラー] データベースからの検索中にエラーが発生:', error);
    return [];
  }
};

// 検索とサジェスト用の総合関数
export const searchBooksWithSuggestions = async (query: string): Promise<Book[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // 1. まず自分のDBから検索
    console.log(`🔍 [検索開始] "${query}" をDBで検索します...`);
    const dbResults = await searchBooksFromDatabase(query);

    if (dbResults.length > 0) {
      console.log(
        `✅ [DB検索成功] "${query}" の検索結果: ${dbResults.length}件の書籍をDBから取得しました`
      );
      return dbResults;
    }

    // 2. DBで結果が見つからなければGoogle Books APIを使用
    console.log(`ℹ️ [DB検索] "${query}" に一致する書籍はDBに見つかりませんでした`);
    console.log(`🔍 [API検索開始] "${query}" をGoogle Books APIで検索します...`);

    const { books: apiResults } = await searchBooksByTitle({
      query,
      maxResults: 10, // サジェストは10件に制限
    });

    if (apiResults.length > 0) {
      console.log(
        `✅ [API検索成功] "${query}" の検索結果: ${apiResults.length}件の書籍をAPIから取得しました`
      );

      // 3. 将来的な検索のために結果をDBに保存
      console.log(`💾 APIで取得した書籍情報をDBに保存します...`);
      // 非同期で保存（レスポンスを待たない）
      Promise.all(apiResults.map(book => saveBookToDB(book))).catch(error => {
        console.error('❌ [DB保存エラー] 書籍のDB保存中にエラーが発生:', error);
      });
    } else {
      console.log(`ℹ️ [API検索] "${query}" に一致する書籍はAPIにも見つかりませんでした`);
    }

    return apiResults;
  } catch (error) {
    console.error('❌ [検索エラー] searchBooksWithSuggestionsでエラーが発生:', error);
    return [];
  }
};
