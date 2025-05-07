import { saveBookToDB } from '@/lib/supabase/books';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Book, UserBook } from '@/types';

// ユーザーの本棚に書籍を追加する関数
export const addBookToUserShelf = async (
  userId: string,
  book: Book,
  status: 'unread' | 'reading' | 'done' = 'unread'
): Promise<UserBook | null> => {
  try {
    const supabase = getSupabaseClient();

    console.log(`ユーザー(${userId})の本棚に書籍を追加します:`, book.title);

    // 1. まず、booksテーブルに書籍が存在するか確認
    let bookId: string;

    // ISBNがある場合はISBNで検索
    if (book.isbn) {
      const { data: existingBookData } = await supabase
        .from('books')
        .select('id')
        .eq('isbn', book.isbn)
        .maybeSingle();

      if (existingBookData) {
        console.log('既存の書籍をISBNで発見:', existingBookData.id);
        bookId = existingBookData.id as string;
      } else {
        // 2. タイトルで検索
        const { data: titleBookData } = await supabase
          .from('books')
          .select('id')
          .eq('title', book.title)
          .maybeSingle();

        if (titleBookData) {
          console.log('既存の書籍をタイトルで発見:', titleBookData.id);
          bookId = titleBookData.id as string;
        } else {
          // 3. 存在しない場合は新規保存
          console.log('書籍が存在しないため新規保存します');
          const savedBook = await saveBookToDB(book);

          if (!savedBook) {
            console.error('書籍の保存に失敗しました');
            return null;
          }

          // 保存された書籍IDを検索
          const { data: newBookData } = await supabase
            .from('books')
            .select('id')
            .eq('title', book.title)
            .maybeSingle();

          if (!newBookData) {
            console.error('保存した書籍が見つかりません');
            return null;
          }

          bookId = newBookData.id as string;
        }
      }
    } else {
      // ISBNがない場合はタイトルで検索
      const { data: titleBookData } = await supabase
        .from('books')
        .select('id')
        .eq('title', book.title)
        .maybeSingle();

      if (titleBookData) {
        console.log('既存の書籍をタイトルで発見:', titleBookData.id);
        bookId = titleBookData.id as string;
      } else {
        // 存在しない場合は新規保存
        console.log('書籍が存在しないため新規保存します');
        const savedBook = await saveBookToDB(book);

        if (!savedBook) {
          console.error('書籍の保存に失敗しました');
          return null;
        }

        // 保存された書籍IDを検索
        const { data: newBookData } = await supabase
          .from('books')
          .select('id')
          .eq('title', book.title)
          .maybeSingle();

        if (!newBookData) {
          console.error('保存した書籍が見つかりません');
          return null;
        }

        bookId = newBookData.id as string;
      }
    }

    // 4. すでにユーザーの本棚に存在するか確認
    const { data: existingUserBook } = await supabase
      .from('user_books')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .maybeSingle();

    if (existingUserBook) {
      console.log('この書籍はすでにユーザーの本棚に存在します');
      // 既存のユーザー書籍データを返す
      return {
        id: existingUserBook.id as string,
        user_id: existingUserBook.user_id as string,
        book,
        status: existingUserBook.status as 'unread' | 'reading' | 'done',
        progress: 0, // progressフィールドを使用しない
        added_at: existingUserBook.added_at as string,
        finished_at: existingUserBook.finished_at as string | null,
      };
    }

    // 5. user_booksテーブルに追加
    const now = new Date().toISOString();
    const userBookData = {
      user_id: userId,
      book_id: bookId,
      status,
      // progressフィールドを削除
      added_at: now,
      finished_at: status === 'done' ? now : null,
    };

    const { data: insertedUserBook, error } = await supabase
      .from('user_books')
      .insert([userBookData])
      .select()
      .single();

    if (error) {
      console.error('ユーザー書籍の追加エラー:', error);
      return null;
    }

    console.log('ユーザー書籍を正常に追加しました:', insertedUserBook);

    // 追加されたユーザー書籍データを返す
    return {
      id: insertedUserBook.id as string,
      user_id: insertedUserBook.user_id as string,
      book,
      status: insertedUserBook.status as 'unread' | 'reading' | 'done',
      progress: 0, // progressフィールドを使用しない
      added_at: insertedUserBook.added_at as string,
      finished_at: insertedUserBook.finished_at as string | null,
    };
  } catch (error) {
    console.error('addBookToUserShelf内でエラー発生:', error);
    return null;
  }
};

// ユーザーの本棚の書籍を取得する関数
export const getUserBooks = async (userId: string): Promise<UserBook[]> => {
  try {
    const supabase = getSupabaseClient();

    console.log(`ユーザー(${userId})の本棚を取得します`);

    // user_booksテーブルからuserの書籍を取得し、関連するbook情報も結合
    // booksとのリレーションの修正
    const { data, error } = await supabase
      .from('user_books')
      .select(
        `
        id,
        user_id,
        book_id,
        status,
        added_at,
        finished_at,
        books(*)
      `
      )
      .eq('user_id', userId);

    if (error) {
      console.error('ユーザー書籍の取得エラー:', error);
      return [];
    }

    console.log(`${data?.length || 0}件のユーザー書籍を取得しました`);

    // 結果を整形して返す
    return (data || []).map(item => {
      const bookData = item.books || {};
      return {
        id: item.id as string,
        user_id: item.user_id as string,
        book: {
          id: bookData.id as string,
          isbn: (bookData.isbn as string) || '',
          title: bookData.title as string,
          author: (bookData.author as string) || '不明',
          language: (bookData.language as string) || '日本語',
          categories: Array.isArray(bookData.categories) ? bookData.categories : [],
          img_url: (bookData.img_url as string) || '',
          avg_difficulty: (bookData.avg_difficulty as number) || 0,
          description: (bookData.description as string) || '',
          programmingLanguages: Array.isArray(bookData.programming_languages)
            ? bookData.programming_languages
            : [],
          frameworks: Array.isArray(bookData.frameworks) ? bookData.frameworks : [],
        },
        status: item.status as 'unread' | 'reading' | 'done',
        progress: 0, // progressフィールドを使用しない
        added_at: item.added_at as string,
        finished_at: item.finished_at as string | null,
      };
    });
  } catch (error) {
    console.error('getUserBooks内でエラー発生:', error);
    return [];
  }
};

// 書籍のステータスを更新する関数
export const updateUserBookStatus = async (
  userBookId: string,
  newStatus: 'unread' | 'reading' | 'done'
): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();

    console.log(`書籍ステータスを更新します: ${userBookId} → ${newStatus}`);

    const now = new Date().toISOString();
    const updateData: {
      status: 'unread' | 'reading' | 'done';
      finished_at: string | null;
    } = {
      status: newStatus,
      finished_at: newStatus === 'done' ? now : null,
    };

    const { error } = await supabase.from('user_books').update(updateData).eq('id', userBookId);

    if (error) {
      console.error('書籍ステータスの更新エラー:', error);
      return false;
    }

    console.log('書籍ステータスを正常に更新しました');
    return true;
  } catch (error) {
    console.error('updateUserBookStatus内でエラー発生:', error);
    return false;
  }
};

// 書籍を本棚から削除する関数
export const deleteUserBook = async (userBookId: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();

    console.log(`本棚から書籍を削除します: ${userBookId}`);

    const { error } = await supabase.from('user_books').delete().eq('id', userBookId);

    if (error) {
      console.error('書籍削除エラー:', error);
      return false;
    }

    console.log('書籍を本棚から正常に削除しました');
    return true;
  } catch (error) {
    console.error('deleteUserBook内でエラー発生:', error);
    return false;
  }
};
