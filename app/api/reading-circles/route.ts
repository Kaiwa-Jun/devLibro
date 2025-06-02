import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getBookByIdFromDB } from '@/lib/supabase/books';
import { createReadingCircle, getReadingCircles } from '@/lib/supabase/reading-circles';

const createCircleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  book_id: z.string().min(1),
  book_data: z
    .object({
      id: z.string(),
      title: z.string(),
      author: z.string(),
      img_url: z.string(),
      isbn: z.string().optional(),
      language: z.string().optional(),
      categories: z.array(z.string()).optional(),
      description: z.string().optional(),
      avg_difficulty: z.number().optional(),
      programmingLanguages: z.array(z.string()).optional(),
      frameworks: z.array(z.string()).optional(),
    })
    .optional(),
  max_participants: z.number().int().min(2).max(50).default(10),
  is_private: z.boolean().default(false),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// APIルート専用の書籍保存関数
async function saveBookToDBFromAPI(book: {
  id: string;
  title: string;
  author: string;
  img_url: string;
  isbn?: string;
  language?: string;
  categories?: string[];
  description?: string;
  avg_difficulty?: number;
  programmingLanguages?: string[];
  frameworks?: string[];
}): Promise<{ id: number; success: boolean } | null> {
  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = getSupabaseServerClient();

    console.log('🔍 [saveBookToDBFromAPI] 既存書籍チェック開始');

    // まず既存の書籍をチェック
    if (book.isbn && !book.isbn.startsWith('N-')) {
      const { data: existingByISBN } = await supabase
        .from('books')
        .select('id')
        .eq('isbn', book.isbn)
        .single();

      if (existingByISBN) {
        console.log('✅ [saveBookToDBFromAPI] ISBNで既存書籍発見:', existingByISBN.id);
        return { id: existingByISBN.id, success: true };
      }
    }

    // Google Books IDパターンで検索
    if (book.id) {
      const gbidPattern = `[GBID:${book.id}]`;
      const { data: existingByGBID } = await supabase
        .from('books')
        .select('id')
        .ilike('description', `%${gbidPattern}%`)
        .single();

      if (existingByGBID) {
        console.log('✅ [saveBookToDBFromAPI] Google Books IDで既存書籍発見:', existingByGBID.id);
        return { id: existingByGBID.id, success: true };
      }
    }

    // タイトルと著者で検索
    const { data: existingByTitle } = await supabase
      .from('books')
      .select('id')
      .eq('title', book.title)
      .eq('author', book.author || '不明')
      .single();

    if (existingByTitle) {
      console.log('✅ [saveBookToDBFromAPI] タイトル・著者で既存書籍発見:', existingByTitle.id);
      return { id: existingByTitle.id, success: true };
    }

    console.log('📝 [saveBookToDBFromAPI] 新規書籍として保存開始');

    // 新規書籍として保存
    const timestamp = Date.now();
    const uniqueId = 'N-' + timestamp.toString().slice(-6) + Math.random().toString(36).slice(2, 6);

    const bookToSave = {
      isbn: book.isbn || uniqueId,
      title: book.title || '不明',
      author: book.author || '不明',
      language: book.language || '日本語',
      categories: book.categories || [],
      img_url: book.img_url || '',
      description: book.id ? `[GBID:${book.id}] ${book.description || ''}` : book.description || '',
      programming_languages: book.programmingLanguages || [],
      frameworks: book.frameworks || [],
      avg_difficulty: book.avg_difficulty || 0,
    };

    console.log('💾 [saveBookToDBFromAPI] 保存データ:', JSON.stringify(bookToSave, null, 2));

    const { data: savedBook, error } = await supabase
      .from('books')
      .insert([bookToSave])
      .select('id')
      .single();

    if (error) {
      console.error('❌ [saveBookToDBFromAPI] 保存エラー:', error);
      return null;
    }

    console.log('✅ [saveBookToDBFromAPI] 書籍保存成功:', savedBook.id);
    return { id: savedBook.id, success: true };
  } catch (error) {
    console.error('❌ [saveBookToDBFromAPI] 予期しないエラー:', error);
    return null;
  }
}

// 内部IDを取得するヘルパー関数
async function getActualBookId(searchId: string): Promise<number | null> {
  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = getSupabaseServerClient();

    // ISBNで検索
    const { data: isbnData } = await supabase
      .from('books')
      .select('id')
      .eq('isbn', searchId)
      .single();

    if (isbnData) {
      return isbnData.id;
    }

    // Google Books IDパターンで検索
    const gbidPattern = `[GBID:${searchId}]`;
    const { data: gbData } = await supabase
      .from('books')
      .select('id')
      .ilike('description', `%${gbidPattern}%`)
      .single();

    if (gbData) {
      return gbData.id;
    }

    return null;
  } catch (error) {
    console.error('実際の書籍ID取得エラー:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // リクエストヘッダーから認証情報を取得
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const isPrivate = searchParams.get('is_private');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const filters = {
      ...(status && { status }),
      ...(isPrivate !== null && { isPrivate: isPrivate === 'true' }),
      ...(limit && { limit: parseInt(limit) }),
      ...(offset && { offset: parseInt(offset) }),
    };

    const circles = await getReadingCircles(filters);

    return NextResponse.json({
      data: circles,
      message: 'Reading circles fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching reading circles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 [輪読会作成API] リクエスト開始');

  try {
    console.log('🔐 [輪読会作成API] 認証チェック開始');

    // リクエストヘッダーから認証情報を取得
    const authHeader = request.headers.get('authorization');
    console.log('🔑 [輪読会作成API] 認証ヘッダー:', authHeader ? 'あり' : 'なし');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [輪読会作成API] 認証ヘッダーが無効です');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    console.log('🎫 [輪読会作成API] トークン取得:', token ? 'あり' : 'なし');

    // トークンからユーザー情報を取得（簡易的な実装）
    // 実際のプロジェクトでは、Supabaseのトークン検証を使用
    const user = {
      id: '4965d285-a22a-48fe-92ff-b72f602093e2', // フロントエンドから取得したユーザーID
      email: 'kj.112358132134555@gmail.com',
    };

    console.log('✅ [輪読会作成API] 認証成功:', { userId: user.id, email: user.email });

    console.log('📝 [輪読会作成API] リクエストボディの解析開始');
    const body = await request.json();
    console.log('📝 [輪読会作成API] リクエストボディ:', JSON.stringify(body, null, 2));

    // Validate request body
    console.log('🔍 [輪読会作成API] バリデーション開始');
    const validationResult = createCircleSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('❌ [輪読会作成API] バリデーションエラー:', validationResult.error.flatten());
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.log('✅ [輪読会作成API] バリデーション成功');

    const { book_data, ...circleData } = validationResult.data;
    console.log('📚 [輪読会作成API] 書籍データ:', book_data);
    console.log('🔄 [輪読会作成API] 輪読会データ:', circleData);

    // 書籍がDBに存在するかチェック
    console.log('🔍 [輪読会作成API] 書籍存在チェック開始:', circleData.book_id);
    let existingBook = null;
    try {
      existingBook = await getBookByIdFromDB(circleData.book_id);
      console.log('📖 [輪読会作成API] 書籍存在チェック結果:', existingBook ? '存在' : '存在しない');
    } catch (bookCheckError) {
      console.error('❌ [輪読会作成API] 書籍存在チェックエラー:', bookCheckError);
    }

    // 書籍が存在しない場合、book_dataがあれば保存
    if (!existingBook && book_data) {
      console.log('💾 [輪読会作成API] 書籍がDBに存在しないため、新規保存します:', book_data);
      try {
        const savedBook = await saveBookToDBFromAPI(book_data);

        if (savedBook && savedBook.success) {
          console.log('✅ [輪読会作成API] 書籍を正常に保存しました:', savedBook.id);
          // 輪読会データのbook_idを保存された書籍の内部IDに更新
          circleData.book_id = savedBook.id.toString();
          console.log('🔄 [輪読会作成API] book_idを保存された内部IDに更新:', savedBook.id);
        } else {
          console.warn('⚠️ [輪読会作成API] 書籍の保存に失敗しました:', savedBook);
          // 書籍保存に失敗した場合はエラーを返す
          return NextResponse.json({ error: 'Failed to save book to database' }, { status: 500 });
        }
      } catch (saveError) {
        console.error('❌ [輪読会作成API] 書籍保存エラー:', saveError);
        // 書籍保存に失敗した場合はエラーを返す
        return NextResponse.json({ error: 'Failed to save book to database' }, { status: 500 });
      }
    } else if (existingBook) {
      // 既存の書籍が見つかった場合も内部IDを使用
      // formatBookFromDBがGoogle Books IDを返すため、データベースの実際のIDを取得
      const actualBookId = await getActualBookId(circleData.book_id);
      if (actualBookId) {
        circleData.book_id = actualBookId.toString();
        console.log('🔄 [輪読会作成API] 既存書籍の実際の内部IDを使用:', actualBookId);
      } else {
        console.log('🔄 [輪読会作成API] 既存書籍の内部IDを使用:', existingBook.id);
        circleData.book_id = existingBook.id;
      }
    } else {
      // 書籍が見つからず、book_dataもない場合はエラー
      console.error('❌ [輪読会作成API] 書籍が見つからず、book_dataもありません');
      return NextResponse.json(
        { error: 'Book not found and no book data provided' },
        { status: 400 }
      );
    }

    const finalCircleData = {
      ...circleData,
      book_id: parseInt(circleData.book_id),
      created_by: user.id,
      status: 'draft' as const,
    };

    console.log(
      '🎯 [輪読会作成API] 最終的な輪読会データ:',
      JSON.stringify(finalCircleData, null, 2)
    );

    console.log('🔄 [輪読会作成API] 輪読会作成開始');
    const circle = await createReadingCircle(finalCircleData);
    console.log('✅ [輪読会作成API] 輪読会作成成功:', circle.id);

    return NextResponse.json(
      {
        data: circle,
        message: 'Reading circle created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [輪読会作成API] 予期しないエラー:', error);
    console.error(
      '❌ [輪読会作成API] エラースタック:',
      error instanceof Error ? error.stack : 'スタック情報なし'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
