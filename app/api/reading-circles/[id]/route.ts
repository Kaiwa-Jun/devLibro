import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  deleteReadingCircle,
  getReadingCircleById,
  updateReadingCircle,
} from '@/lib/supabase/reading-circles';

const updateCircleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  book_id: z.string().optional(),
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
  max_participants: z.number().int().min(2).max(50).optional(),
  is_private: z.boolean().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['draft', 'recruiting', 'active', 'completed', 'cancelled']).optional(),
});

// 認証ヘルパー関数
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const { getSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  return user;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔍 [輪読会詳細取得API] リクエスト開始:', params.id);

    const user = await authenticateUser(request);
    if (!user) {
      console.log('❌ [輪読会詳細取得API] 認証失敗');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [輪読会詳細取得API] 認証成功:', user.id);

    const circle = await getReadingCircleById(params.id);
    console.log('✅ [輪読会詳細取得API] 輪読会取得成功');

    return NextResponse.json({
      data: circle,
      message: 'Reading circle fetched successfully',
    });
  } catch (error) {
    console.error('❌ [輪読会詳細取得API] エラー:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Reading circle not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔄 [輪読会更新API] リクエスト開始:', params.id);

    const user = await authenticateUser(request);
    if (!user) {
      console.log('❌ [輪読会更新API] 認証失敗');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [輪読会更新API] 認証成功:', user.id);

    // Check if user is the creator or has permission to edit
    const existingCircle = await getReadingCircleById(params.id);
    console.log('🔍 [輪読会更新API] 既存輪読会確認:', existingCircle.created_by);

    if (existingCircle.created_by !== user.id) {
      // Check if user is an organizer
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const supabase = getSupabaseServerClient();

      const { data: participant } = await supabase
        .from('circle_participants')
        .select('role')
        .eq('circle_id', params.id)
        .eq('user_id', user.id)
        .eq('role', 'organizer')
        .eq('status', 'approved')
        .single();

      if (!participant) {
        console.log('❌ [輪読会更新API] 権限なし');
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to edit this circle' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    console.log('📝 [輪読会更新API] リクエストボディ:', JSON.stringify(body, null, 2));

    // 各フィールドの型をチェック
    console.log('🔍 [輪読会更新API] フィールド型チェック:');
    console.log('  - title:', typeof body.title, body.title);
    console.log('  - description:', typeof body.description, body.description);
    console.log('  - book_id:', typeof body.book_id, body.book_id);
    console.log('  - max_participants:', typeof body.max_participants, body.max_participants);
    console.log('  - is_private:', typeof body.is_private, body.is_private);
    console.log('  - start_date:', typeof body.start_date, body.start_date);
    console.log('  - end_date:', typeof body.end_date, body.end_date);
    console.log('  - book_data:', typeof body.book_data, body.book_data ? 'exists' : 'null');

    if (body.book_data) {
      console.log('📚 [輪読会更新API] book_data詳細:');
      console.log('  - id:', typeof body.book_data.id, body.book_data.id);
      console.log('  - title:', typeof body.book_data.title, body.book_data.title);
      console.log('  - author:', typeof body.book_data.author, body.book_data.author);
      console.log('  - img_url:', typeof body.book_data.img_url, body.book_data.img_url);
    }

    // Validate request body
    console.log('🔍 [輪読会更新API] バリデーション開始');
    console.log('🔍 [輪読会更新API] バリデーション前のbody:', JSON.stringify(body, null, 2));
    const validationResult = updateCircleSchema.safeParse(body);

    if (!validationResult.success) {
      console.log('❌ [輪読会更新API] バリデーションエラー詳細:');
      console.log('  - エラー:', JSON.stringify(validationResult.error, null, 2));
      console.log(
        '  - フィールドエラー:',
        JSON.stringify(validationResult.error.flatten().fieldErrors, null, 2)
      );
      console.log(
        '  - フォーマットエラー:',
        JSON.stringify(validationResult.error.flatten().formErrors, null, 2)
      );

      // 各フィールドのバリデーション結果を個別にチェック
      const issues = validationResult.error.issues;
      issues.forEach((issue, index) => {
        console.log(`  - Issue ${index + 1}:`, {
          path: issue.path,
          message: issue.message,
          code: issue.code,
          received: 'received' in issue ? issue.received : undefined,
          expected: 'expected' in issue ? issue.expected : undefined,
        });
      });

      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    console.log('✅ [輪読会更新API] バリデーション成功');
    console.log(
      '📝 [輪読会更新API] バリデーション後データ:',
      JSON.stringify(validationResult.data, null, 2)
    );

    const { book_data, book_id, ...updateData } = validationResult.data;

    // 書籍データの処理（登録処理と同じ仕組み）
    let finalBookId = existingCircle.book_id;
    if (book_data || book_id) {
      console.log('📚 [輪読会更新API] 書籍データ更新開始');

      const { getBookByIdFromDB } = await import('@/lib/supabase/books');

      // 使用する書籍IDを決定
      const targetBookId = book_data?.id || book_id;
      console.log('📚 [輪読会更新API] 対象書籍ID:', targetBookId);

      if (targetBookId) {
        // 書籍がDBに存在するかチェック
        console.log('🔍 [輪読会更新API] 書籍存在チェック開始:', targetBookId);
        let existingBook = null;
        try {
          existingBook = await getBookByIdFromDB(targetBookId);
          console.log(
            '📖 [輪読会更新API] 書籍存在チェック結果:',
            existingBook ? '存在' : '存在しない'
          );
        } catch (bookCheckError) {
          console.error('❌ [輪読会更新API] 書籍存在チェックエラー:', bookCheckError);
        }

        // 書籍が存在しない場合、book_dataがあれば保存
        if (!existingBook && book_data) {
          console.log('💾 [輪読会更新API] 書籍がDBに存在しないため、新規保存します:', book_data);
          try {
            const savedBook = await saveBookToDBFromAPI(book_data);

            if (savedBook && savedBook.success) {
              console.log('✅ [輪読会更新API] 書籍を正常に保存しました:', savedBook.id);
              finalBookId = savedBook.id;
            } else {
              console.warn('⚠️ [輪読会更新API] 書籍の保存に失敗しました:', savedBook);
              throw new Error('Failed to save book to database');
            }
          } catch (saveError) {
            console.error('❌ [輪読会更新API] 書籍保存エラー:', saveError);
            throw new Error('Failed to save book to database');
          }
        } else if (existingBook) {
          // 既存の書籍が見つかった場合、実際の内部IDを取得
          const actualBookId = await getActualBookId(targetBookId);
          if (actualBookId) {
            finalBookId = actualBookId;
            console.log('🔄 [輪読会更新API] 既存書籍の実際の内部IDを使用:', actualBookId);
          } else {
            finalBookId = existingBook.id;
            console.log('🔄 [輪読会更新API] 既存書籍の内部IDを使用:', existingBook.id);
          }

          // book_dataがある場合は既存書籍を更新
          if (book_data) {
            console.log('📝 [輪読会更新API] 既存書籍を更新');
            const { getSupabaseServerClient } = await import('@/lib/supabase/server');
            const supabase = getSupabaseServerClient();

            const { error: updateBookError } = await supabase
              .from('books')
              .update({
                title: book_data.title,
                author: book_data.author,
                img_url: book_data.img_url,
                isbn: book_data.isbn || '',
                language: book_data.language || 'ja',
                categories: book_data.categories || [],
                description: book_data.id
                  ? `[GBID:${book_data.id}] ${book_data.description || ''}`
                  : book_data.description || '',
                avg_difficulty: book_data.avg_difficulty || 0,
                programming_languages: book_data.programmingLanguages || [],
                frameworks: book_data.frameworks || [],
                updated_at: new Date().toISOString(),
              })
              .eq('id', finalBookId);

            if (updateBookError) {
              console.error('❌ [輪読会更新API] 書籍更新エラー:', updateBookError);
              throw new Error(`Failed to update book: ${updateBookError.message}`);
            } else {
              console.log('✅ [輪読会更新API] 書籍更新成功');
            }
          }
        } else {
          // 書籍が見つからず、book_dataもない場合はエラー
          console.error('❌ [輪読会更新API] 書籍が見つからず、book_dataもありません');
          throw new Error('Book not found and no book data provided');
        }
      }

      console.log('📚 [輪読会更新API] 最終書籍ID:', finalBookId);
    }

    // 輪読会データの更新
    const circleUpdateData = {
      ...updateData,
      book_id: finalBookId,
    };

    console.log('🔄 [輪読会更新API] 輪読会更新データ:', JSON.stringify(circleUpdateData, null, 2));

    const updatedCircle = await updateReadingCircle(params.id, circleUpdateData);
    console.log('✅ [輪読会更新API] 更新成功');

    // 更新後の最新データを取得
    const latestCircle = await getReadingCircleById(params.id);

    return NextResponse.json({
      data: latestCircle,
      message: 'Reading circle updated successfully',
    });
  } catch (error) {
    console.error('❌ [輪読会更新API] エラー:', error);
    console.error(
      '❌ [輪読会更新API] エラースタック:',
      error instanceof Error ? error.stack : 'No stack trace'
    );

    // エラーの詳細情報をログに出力
    if (error instanceof Error) {
      console.error('❌ [輪読会更新API] エラーメッセージ:', error.message);
      console.error('❌ [輪読会更新API] エラー名:', error.name);
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Reading circle not found' }, { status: 404 });
    }

    // バリデーションエラーの場合
    if (error instanceof Error && error.message.includes('Invalid book_id format')) {
      return NextResponse.json(
        {
          error: 'Invalid book ID format',
          details: error.message,
          hint: 'Book ID should be a Google Books ID (string format)',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🗑️ [輪読会削除API] リクエスト開始:', params.id);

    const user = await authenticateUser(request);
    if (!user) {
      console.log('❌ [輪読会削除API] 認証失敗');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [輪読会削除API] 認証成功:', user.id);

    // Check if user is the creator
    const existingCircle = await getReadingCircleById(params.id);
    console.log('🔍 [輪読会削除API] 既存輪読会確認:', existingCircle.created_by);

    if (existingCircle.created_by !== user.id) {
      console.log('❌ [輪読会削除API] 権限なし - 作成者のみ削除可能');
      return NextResponse.json(
        { error: 'Forbidden: Only the creator can delete this circle' },
        { status: 403 }
      );
    }

    console.log('🗑️ [輪読会削除API] 削除実行中...');
    await deleteReadingCircle(params.id);
    console.log('✅ [輪読会削除API] 削除成功');

    return NextResponse.json({
      message: 'Reading circle deleted successfully',
    });
  } catch (error) {
    console.error('❌ [輪読会削除API] エラー:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Reading circle not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 登録処理と同じ書籍保存関数
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

// 登録処理と同じ内部ID取得関数
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
