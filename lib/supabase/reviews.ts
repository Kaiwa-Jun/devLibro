import { getSupabaseClient } from './client';

export type ReviewInput = {
  bookId: string;
  userId: string;
  difficulty: number;
  comment: string;
  displayType: 'anon' | 'user' | 'custom';
  customPenName?: string;
};

/**
 * 書籍IDをDBの実際のIDに変換する
 *
 * 書籍はGoogleBooksIDが含まれている場合にそれをidとして返すため、
 * レビュー追加時に実際のDB上のidを取得する必要がある
 */
const getActualBookId = async (bookId: string): Promise<number | null> => {
  try {
    console.log('書籍ID変換開始:', bookId);

    // ハードコードされたマッピングは削除し、実際のDBでIDを探す

    const supabase = getSupabaseClient();

    // 1. まず数値に変換可能ならそのまま試す（最優先）
    const numericId = parseInt(bookId, 10);
    if (!isNaN(numericId)) {
      console.log('数値IDを検索:', numericId);
      // 実際にIDが存在するか確認
      const { data, error } = await supabase
        .from('books')
        .select('id, title')
        .eq('id', numericId)
        .single();

      if (!error && data) {
        console.log(`数値IDで書籍を特定: ID=${data.id}, タイトル=${data.title}`);
        return data.id as number;
      } else {
        console.log('数値IDでは書籍が見つかりませんでした:', error?.message);
      }
    }

    // 2. GoogleBooksIDの場合はそのIDを含む書籍を探す
    const gbidPattern = `[GBID:${bookId}]`;
    console.log('GoogleBooksIDで検索:', gbidPattern);
    const { data: gbData, error: gbError } = await supabase
      .from('books')
      .select('id, title')
      .ilike('description', `%${gbidPattern}%`);

    if (!gbError && gbData && gbData.length > 0) {
      console.log(`GoogleBooksIDで書籍を特定: ID=${gbData[0].id}, タイトル=${gbData[0].title}`);
      return gbData[0].id as number;
    } else {
      console.log('GoogleBooksIDでは書籍が見つかりませんでした');
    }

    // 3. より広い検索（description内の任意の場所にIDがある場合）
    console.log('より広い検索パターンで検索:', bookId);
    const { data: widerData, error: widerError } = await supabase
      .from('books')
      .select('id, title')
      .or(`description.ilike.%${bookId}%`);

    if (!widerError && widerData && widerData.length > 0) {
      console.log(`広い検索で書籍を特定: ID=${widerData[0].id}, タイトル=${widerData[0].title}`);
      return widerData[0].id as number;
    } else {
      console.log('広い検索でも書籍が見つかりませんでした');
    }

    // 4. タイトルで検索してみる（最後の手段）
    console.log('タイトルで検索を試みる:', bookId);
    const { data: titleData, error: titleError } = await supabase
      .from('books')
      .select('id, title')
      .eq('google_books_id', bookId);

    if (!titleError && titleData && titleData.length > 0) {
      console.log(
        `google_books_idで書籍を特定: ID=${titleData[0].id}, タイトル=${titleData[0].title}`
      );
      return titleData[0].id as number;
    }

    // 5. デバッグ用: 利用可能な書籍を取得して確認
    console.log('利用可能な書籍IDを確認:');
    const { data: allBooks } = await supabase.from('books').select('id, title').limit(5);

    if (allBooks) {
      console.log(
        '利用可能な書籍ID例:',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allBooks.map((b: any) => ({ id: b.id, title: b.title }))
      );
    }

    // それでも見つからない場合
    console.error('書籍ID変換失敗:', bookId);
    return null;
  } catch (error) {
    console.error('getActualBookId内でエラー発生:', error);
    return null;
  }
};

/**
 * ユーザーが書籍に対してすでにレビューを投稿しているか確認
 */
const hasUserReviewedBook = async (userId: string, bookId: number): Promise<boolean> => {
  try {
    console.log(`レビュー重複チェック: userId=${userId}, bookId=${bookId}`);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('id, book_id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .limit(1);

    if (error) {
      console.error('レビュー確認エラー:', error);
      return false; // エラーの場合はfalseを返す
    }

    const hasReview = data && data.length > 0;
    console.log(`レビュー存在確認: ${hasReview ? '既存のレビューあり' : 'レビューなし'}`);
    if (hasReview) {
      console.log('既存レビュー:', data);
    }
    return hasReview;
  } catch (error) {
    console.error('hasUserReviewedBook内でエラー発生:', error);
    return false;
  }
};

/**
 * レビューを追加する関数
 */
export const addReview = async (reviewData: ReviewInput) => {
  try {
    console.log('レビュー追加開始:', {
      bookId: reviewData.bookId,
      userId: reviewData.userId,
      difficulty: reviewData.difficulty,
      displayType: reviewData.displayType,
    });

    const supabase = getSupabaseClient();

    // 実際のDBのbook_idを取得
    const actualBookId = await getActualBookId(reviewData.bookId);
    console.log('変換後の書籍ID:', actualBookId);

    if (actualBookId === null) {
      console.error('書籍が見つかりません:', reviewData.bookId);
      return {
        data: null,
        error: { message: '該当する書籍が見つかりません' },
      };
    }

    // ユーザーがすでにこの書籍のレビューを投稿しているか確認
    const hasReviewed = await hasUserReviewedBook(reviewData.userId, actualBookId);
    if (hasReviewed) {
      console.error('重複レビュー:', { userId: reviewData.userId, bookId: actualBookId });
      return {
        data: null,
        error: { message: 'すでにこの書籍のレビューを投稿しています' },
      };
    }

    // ユーザーの経験年数を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('experience_years')
      .eq('id', reviewData.userId)
      .single();

    if (userError) {
      console.error('ユーザー情報取得エラー:', userError);
    }

    const experienceYears = userData?.experience_years || 0;
    console.log('ユーザーの経験年数:', experienceYears);

    // テーブル構造に合わせたデータを準備
    const reviewToSave = {
      book_id: actualBookId,
      user_id: reviewData.userId,
      difficulty: reviewData.difficulty,
      comment: reviewData.comment,
      display_type: reviewData.displayType,
      custom_pen_name: reviewData.displayType === 'custom' ? reviewData.customPenName : null,
      helpful_votes: 0,
      experience_years: experienceYears,
    };

    console.log('保存するレビューデータ:', reviewToSave);

    // レビューを挿入
    const { data, error } = await supabase.from('reviews').insert([reviewToSave]).select().single();

    if (error) {
      console.error('レビュー保存エラー:', error);
      return {
        data: null,
        error: { message: error.message || 'レビュー保存中にエラーが発生しました' },
      };
    }

    console.log('レビューが正常に保存されました:', data);
    return { data, error: null };
  } catch (error) {
    console.error('addReview内でエラー発生:', error);
    return {
      data: null,
      error: {
        message:
          error instanceof Error ? error.message : 'レビュー保存中に不明なエラーが発生しました',
      },
    };
  }
};

/**
 * 書籍のレビューを取得する関数
 */
export const getBookReviews = async (bookId: string) => {
  try {
    const supabase = getSupabaseClient();

    const actualBookId = await getActualBookId(bookId);
    if (actualBookId === null) {
      return { data: null, error: { message: '該当する書籍が見つかりません' } };
    }

    const { data, error } = await supabase
      .from('reviews')
      .select(
        `
        *,
        users:user_id (display_name, avatar_url)
      `
      )
      .eq('book_id', actualBookId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('レビュー取得エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('getBookReviews内でエラー発生:', error);
    return { data: null, error };
  }
};
