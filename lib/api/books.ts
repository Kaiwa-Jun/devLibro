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

// タイトルによる書籍検索
export const searchBooksByTitle = async (title: string): Promise<Book[]> => {
  try {
    const params = new URLSearchParams({
      q: `intitle:${title}`,
      maxResults: '10', // 最大10件の結果を取得
    });

    if (API_KEY) {
      params.append('key', API_KEY);
    }

    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: GoogleBooksResponse = await response.json();

    if (!data.items) {
      return [];
    }

    return data.items.map(mapGoogleBookToBook);
  } catch (error) {
    console.error('Error searching books by title:', error);
    return [];
  }
};

// ISBNによる書籍検索
export const searchBookByISBN = async (isbn: string): Promise<Book | null> => {
  try {
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
      return null;
    }

    return mapGoogleBookToBook(data.items[0]);
  } catch (error) {
    console.error('Error searching book by ISBN:', error);
    return null;
  }
};

// Supabaseデータベースから書籍を検索する関数
export const searchBooksFromDatabase = async (title: string): Promise<Book[]> => {
  if (!title || title.length < 2) return [];

  try {
    return await searchBooksByTitleInDB(title);
  } catch (error) {
    console.error('Error searching books from database:', error);
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
    const dbResults = await searchBooksFromDatabase(query);

    // 2. DBで結果が見つからなければGoogle Books APIを使用
    if (dbResults.length === 0) {
      const apiResults = await searchBooksByTitle(query);

      // 3. 将来的な検索のために結果をDBに保存
      if (apiResults.length > 0) {
        // 非同期で保存（レスポンスを待たない）
        Promise.all(apiResults.map(book => saveBookToDB(book))).catch(error => {
          console.error('Error saving books to DB:', error);
        });
      }

      return apiResults;
    }

    return dbResults;
  } catch (error) {
    console.error('Error in searchBooksWithSuggestions:', error);
    return [];
  }
};
