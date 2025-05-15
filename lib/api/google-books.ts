import { Book } from '@/types';

import { formatASIN } from './commerce';

interface GoogleBooksVolumeInfo {
  title?: string;
  authors?: string[];
  description?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  language?: string;
  categories?: string[];
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
}

interface GoogleBooksItem {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
}

interface GoogleBooksResponse {
  items?: GoogleBooksItem[];
}

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

/**
 * Google Booksの画像URLを高解像度版に変換する関数
 */
const getHighResImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '/images/book-placeholder.png';

  // zoom=1のサムネイルURLを高解像度に変換
  // 例: zoom=1 → zoom=3
  return imageUrl.replace('zoom=1', 'zoom=3').replace('&edge=curl', '');
};

/**
 * Google Books APIで書籍を検索
 */
export const searchBooksByTitle = async (title: string, limit = 10): Promise<Book[]> => {
  try {
    if (!title) return [];

    console.log(`Google Books APIでタイトル検索: "${title}"`);

    const response = await fetch(
      `${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(title)}&maxResults=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Google Books API エラー: ${response.statusText}`);
    }

    const data = (await response.json()) as GoogleBooksResponse;

    if (!data.items || !Array.isArray(data.items)) {
      console.log('検索結果なし');
      return [];
    }

    // Google Books APIの結果をアプリのBook型に変換
    const books: Book[] = data.items.map((item: GoogleBooksItem) => {
      const volumeInfo = item.volumeInfo || {};
      const identifiers = volumeInfo.industryIdentifiers || [];

      // ISBNを取得
      const isbn = identifiers.reduce((acc: string, id) => {
        if (id.type === 'ISBN_13') return id.identifier;
        if (id.type === 'ISBN_10' && !acc) return id.identifier;
        return acc;
      }, '');

      // カテゴリ情報を取得
      const categories = volumeInfo.categories || [];

      return {
        id: item.id, // Google Books ID
        isbn,
        title: volumeInfo.title || '不明なタイトル',
        author: (volumeInfo.authors || []).join(', ') || '不明な著者',
        language: volumeInfo.language || 'ja',
        categories,
        img_url: getHighResImageUrl(
          volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail
        ),
        description: volumeInfo.description || '',
        avg_difficulty: 0, // Google Books APIにはこの情報がないので初期値を設定
        programmingLanguages: [], // 後で処理
        frameworks: [], // 後で処理
      };
    });

    console.log(`Google Books API 検索結果: ${books.length}件`);
    return books;
  } catch (error) {
    console.error('Google Books API検索エラー:', error);
    return [];
  }
};

/**
 * ISBNで書籍を検索
 */
export const searchBookByISBN = async (isbn: string): Promise<Book | null> => {
  try {
    if (!isbn) return null;

    console.log(`Google Books APIでISBN検索: "${isbn}"`);

    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?q=isbn:${encodeURIComponent(isbn)}`);

    if (!response.ok) {
      throw new Error(`Google Books API エラー: ${response.statusText}`);
    }

    const data = (await response.json()) as GoogleBooksResponse;

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      console.log('ISBNでの検索結果なし');
      return null;
    }

    // 最初の結果を使用
    const item = data.items[0];
    const volumeInfo = item.volumeInfo || {};
    const identifiers = volumeInfo.industryIdentifiers || [];

    // ISBNを再確認
    const confirmedIsbn = identifiers.reduce((acc: string, id) => {
      if (id.type === 'ISBN_13') return id.identifier;
      if (id.type === 'ISBN_10' && !acc) return id.identifier;
      return acc;
    }, '');

    // ISBNがない場合はASINを探す
    let asin = !confirmedIsbn
      ? identifiers.reduce((acc: string, id) => {
          if (id.type === 'ASIN' || id.type === 'OTHER') return id.identifier;
          return acc;
        }, '')
      : '';

    // デバッグ用：identifiersの内容をログ出力
    console.log('書籍 ID:', item.id);
    console.log('書籍タイトル:', volumeInfo.title);
    console.log('全Identifiers:', JSON.stringify(identifiers));
    if (asin) {
      console.log('検出されたASIN元の値:', asin);
    }

    // ASINを適切にフォーマット
    if (asin) {
      const originalAsin = asin;
      asin = formatASIN(asin);
      console.log(`ASINをフォーマットしました: ${originalAsin} → ${asin}`);
    }

    // カテゴリ情報を取得
    const categories = volumeInfo.categories || [];

    const book: Book = {
      id: item.id, // Google Books ID
      isbn: confirmedIsbn || asin || isbn, // ISBNがなければASINを使用、それもなければ元の検索ISBN
      title: volumeInfo.title || '不明なタイトル',
      author: (volumeInfo.authors || []).join(', ') || '不明な著者',
      language: volumeInfo.language || 'ja',
      categories,
      img_url: getHighResImageUrl(
        volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail
      ),
      description: volumeInfo.description || '',
      avg_difficulty: 0,
      programmingLanguages: [],
      frameworks: [],
    };

    console.log(`ISBN検索結果: "${book.title}"`);
    return book;
  } catch (error) {
    console.error('Google Books API ISBN検索エラー:', error);
    return null;
  }
};
