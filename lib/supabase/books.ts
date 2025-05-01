import { createClient } from '@supabase/supabase-js';

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

    // ilike を使用して部分一致検索（大文字小文字を区別しない）
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .ilike('title', `%${title}%`)
      .limit(10);

    if (error) {
      console.error('Error searching books in DB:', error);
      return [];
    }

    return data as Book[];
  } catch (error) {
    console.error('Error in searchBooksByTitleInDB:', error);
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

    // 既存の書籍をISBNで確認
    const existingBook = await getBookByISBNFromDB(book.isbn);
    if (existingBook) {
      // 既に存在する場合は既存の書籍を返す
      return existingBook;
    }

    // 新しい書籍を挿入
    const { data, error } = await supabase.from('books').insert([book]).select().single();

    if (error) {
      console.error('Error saving book to DB:', error);
      return null;
    }

    return data as Book;
  } catch (error) {
    console.error('Error in saveBookToDB:', error);
    return null;
  }
};

// 書籍IDで書籍を取得
export const getBookByIdFromDB = async (id: string): Promise<Book | null> => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.from('books').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting book by ID:', error);
      return null;
    }

    return data as Book;
  } catch (error) {
    console.error('Error in getBookByIdFromDB:', error);
    return null;
  }
};
