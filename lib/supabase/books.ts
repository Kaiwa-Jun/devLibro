import { createClient } from '@supabase/supabase-js';

import { mockBooks } from '@/lib/mock-data';
import { Book } from '@/types';

// クライアントサイドでのみ Supabase クライアントを初期化
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials are not provided in environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

// データベースから書籍をタイトルで検索
export const searchBooksByTitleInDB = async (title: string): Promise<Book[]> => {
  try {
    const supabase = getSupabaseClient();

    console.log('タイトルで書籍を検索:', title);

    // ilike を使用して部分一致検索（大文字小文字を区別しない）
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .ilike('title', `%${title}%`)
      .limit(10);

    if (error) {
      console.error('タイトルでの書籍検索エラー:', error);
      return [];
    }

    console.log(`${data?.length || 0}件の書籍が見つかりました`);
    // 取得したデータを適切な形式に変換
    return (data || []).map(book => formatBookFromDB(book));
  } catch (error) {
    console.error('searchBooksByTitleInDB内でエラー発生:', error);
    return [];
  }
};

// ISBNで書籍を検索
export const getBookByISBNFromDB = async (isbn: string): Promise<Book | null> => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.from('books').select('*').eq('isbn', isbn).single();

    if (error) {
      if (error.code === 'PGRST116') {
        // レコードが見つからない場合のエラー
        return null;
      }
      console.error('Error getting book by ISBN:', error);
      return null;
    }

    return data as Book;
  } catch (error) {
    console.error('Error in getBookByISBNFromDB:', error);
    return null;
  }
};

// 書籍をデータベースに保存
export const saveBookToDB = async (book: Book): Promise<Book | null> => {
  try {
    const supabase = getSupabaseClient();

    // 既存の書籍をタイトルで確認
    const { data: existingBooks, error: searchError } = await supabase
      .from('books')
      .select('*')
      .eq('title', book.title);

    if (searchError) {
      console.error('既存書籍の検索エラー:', searchError);
    } else if (existingBooks && existingBooks.length > 0) {
      console.log('タイトルが一致する既存書籍を発見:', existingBooks[0]);
      return formatBookFromDB(existingBooks[0]);
    }

    // テーブル構造に合わせたデータを準備
    const bookToSave = {
      isbn: book.isbn || '',
      title: book.title,
      author: book.author || '不明',
      language: book.language || '日本語',
      categories: book.categories || [],
      img_url: book.img_url || '',
      description: book.description || '',
      // Google Books IDを説明文に含めておく（検索用）
      ...(book.id && { description: `[GBID:${book.id}] ${book.description || ''}` }),
    };

    console.log('保存する書籍データ:', bookToSave);

    // 新しい書籍を挿入
    const { data, error } = await supabase.from('books').insert([bookToSave]).select().single();

    if (error) {
      console.error('書籍保存エラー:', error);
      return null;
    }

    console.log('書籍が正常に保存されました:', data);
    return formatBookFromDB(data);
  } catch (error) {
    console.error('saveBookToDB内でエラー発生:', error);
    return null;
  }
};

// 書籍IDで書籍を取得
export const getBookByIdFromDB = async (id: string): Promise<Book | null> => {
  try {
    const supabase = getSupabaseClient();

    console.log('書籍IDで検索:', id);

    // 数値IDの場合はSupabaseの内部IDとして検索
    if (!isNaN(Number(id))) {
      console.log('数値IDとして検索:', id);
      const { data, error } = await supabase.from('books').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('内部IDでの書籍が見つかりません:', id);
        } else {
          console.error('内部IDでの書籍検索エラー:', error);
        }
      } else if (data) {
        console.log('内部IDで書籍が見つかりました:', data);
        return formatBookFromDB(data);
      }
    }

    // 検索方法1: Google Books IDパターンで検索
    console.log('Google Books ID検索パターン1:', id);
    const gbidPattern = `[GBID:${id}]`;
    const { data: gbData1, error: gbError1 } = await supabase
      .from('books')
      .select('*')
      .ilike('description', `%${gbidPattern}%`);

    if (gbError1) {
      console.error('Google Books ID検索エラー (パターン1):', gbError1);
    } else if (gbData1 && gbData1.length > 0) {
      console.log('Google Books IDで書籍が見つかりました (パターン1):', gbData1[0]);
      return formatBookFromDB(gbData1[0]);
    }

    // 検索方法2: より広い検索パターン
    console.log('Google Books ID検索パターン2:', id);
    const { data: gbData2, error: gbError2 } = await supabase
      .from('books')
      .select('*')
      .or(`description.ilike.%${id}%`);

    if (gbError2) {
      console.error('Google Books ID検索エラー (パターン2):', gbError2);
    } else if (gbData2 && gbData2.length > 0) {
      console.log('Google Books IDで書籍が見つかりました (パターン2):', gbData2[0]);
      return formatBookFromDB(gbData2[0]);
    }

    // それでも見つからない場合は追加の検索
    console.log('ISBNまたはタイトルでの検索試行...');

    // セッションストレージがあればそのデータを使って検索
    let storedBookData = null;
    try {
      const storedBook = sessionStorage.getItem(`book_${id}`);
      if (storedBook) {
        storedBookData = JSON.parse(storedBook);
        console.log('セッションストレージからの書籍データ:', storedBookData);
      }
    } catch (storageError) {
      console.error('セッションストレージからの読み込みエラー:', storageError);
    }

    // ISBNで検索 (セッションストレージからISBNがある場合)
    if (storedBookData?.isbn) {
      const { data: isbnData, error: isbnError } = await supabase
        .from('books')
        .select('*')
        .eq('isbn', storedBookData.isbn);

      if (!isbnError && isbnData && isbnData.length > 0) {
        console.log('ISBNで書籍が見つかりました:', isbnData[0]);
        return formatBookFromDB(isbnData[0]);
      }
    }

    // タイトルで検索 (セッションストレージからタイトルがある場合)
    if (storedBookData?.title) {
      const { data: titleData, error: titleError } = await supabase
        .from('books')
        .select('*')
        .eq('title', storedBookData.title);

      if (!titleError && titleData && titleData.length > 0) {
        console.log('タイトルで書籍が見つかりました:', titleData[0]);
        return formatBookFromDB(titleData[0]);
      }
    }

    // モックデータからの検索を試みる
    console.log('モックデータから検索:', id);
    const mockBook = mockBooks.find(book => book.id === id);
    if (mockBook) {
      console.log('モックデータで書籍が見つかりました:', mockBook);
      return mockBook;
    }

    console.log('書籍が見つかりませんでした:', id);
    return null;
  } catch (error) {
    console.error('getBookByIdFromDB内でエラー発生:', error);
    return null;
  }
};

// DBから取得した書籍データをアプリ形式に変換
function formatBookFromDB(data: Record<string, unknown>): Book {
  // Google Books IDを説明から抽出
  let googleBooksId = '';
  const description = String(data.description || '');

  // パターン1: [GBID:xxx] 形式
  const gbidMatch = description.match(/\[GBID:([^\]]+)\]/);
  if (gbidMatch && gbidMatch[1]) {
    googleBooksId = gbidMatch[1];
  }
  // パターン2: 古い形式の対応
  else {
    const oldGbidMatch = description.match(/Google Books ID: ([^)]+)/);
    if (oldGbidMatch && oldGbidMatch[1]) {
      googleBooksId = oldGbidMatch[1];
    }
  }

  // 説明文からGoogle Books ID部分を削除して表示用に整形
  const cleanDescription = description
    .replace(/\[GBID:[^\]]+\]\s*/, '')
    .replace(/\n\n\(Google Books ID: [^)]+\)/, '');

  // 内部IDを優先使用するか、Google Books IDがあればそれを使用
  const id = googleBooksId || String(data.id || '');

  console.log(`書籍データ変換: ID=${id}, 内部ID=${data.id}, Google Books ID=${googleBooksId}`);

  return {
    id,
    isbn: String(data.isbn || ''),
    title: String(data.title || ''),
    author: String(data.author || '不明'),
    language: String(data.language || '日本語'),
    categories: Array.isArray(data.categories) ? data.categories.map(String) : [],
    img_url: String(data.img_url || ''),
    description: cleanDescription,
    avg_difficulty: typeof data.avg_difficulty === 'number' ? data.avg_difficulty : 0,
  };
}
