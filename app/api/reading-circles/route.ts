import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { createApiRouteSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export interface CreateReadingCircleRequest {
  title: string;
  purpose?: string;
  description?: string;
  book_candidates?: (number | string)[];
  selected_books?: Array<{
    id: string;
    isbn: string;
    title: string;
    author: string;
    language: string;
    categories: string[];
    img_url: string;
    description?: string;
    programmingLanguages?: string[];
    frameworks?: string[];
  }>;
  schedule_candidates?: ScheduleCandidate[];
  max_participants?: number;
  is_public?: boolean;
  requires_approval?: boolean;
}

export interface ScheduleCandidate {
  day_of_week: number; // 0-6 (0: Sunday, 6: Saturday)
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
}

export interface ReadingCircleResponse {
  id: string;
  title: string;
  purpose?: string;
  description?: string;
  status: string;
  invite_url: string;
  created_by: string;
  created_at: string;
  member_count: number;
  max_participants: number;
  book_candidates?: (number | string)[];
  schedule_candidates?: ScheduleCandidate[];
}

// 読書会作成API
export async function POST(request: NextRequest) {
  try {
    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('環境変数チェック:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlStart: supabaseUrl?.substring(0, 30) + '...',
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase環境変数が設定されていません');
    }

    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('Authorization');
    console.log('認証情報:', {
      hasAuthHeader: !!authHeader,
      authHeaderStart: authHeader?.substring(0, 20) + '...',
    });

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('認証ヘッダーが不正です');
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // トークンを使用してSupabaseクライアントを作成
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    console.log('認証チェック結果:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.log('認証エラー:', { authError });
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body: CreateReadingCircleRequest = await request.json();
    console.log('リクエストボディ:', {
      title: body.title,
      hasBookCandidates: !!body.book_candidates,
      bookCandidatesLength: body.book_candidates?.length,
      firstBookId: body.book_candidates?.[0],
      allBookIds: body.book_candidates,
      bodyFull: JSON.stringify(body, null, 2),
    });

    // booksテーブルのスキーマ確認（デバッグ用）
    const { data: sampleBooks, error: sampleError } = await supabase
      .from('books')
      .select('id')
      .limit(3);

    console.log('booksテーブルのサンプルデータ:', {
      sampleBooks,
      sampleError: sampleError?.message,
      idTypes: sampleBooks?.map(book => ({ id: book.id, type: typeof book.id })),
    });

    // バリデーション
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json({ error: 'タイトルは必須です' }, { status: 400 });
    }

    if (body.title.length > 100) {
      return NextResponse.json(
        { error: 'タイトルは100文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (body.description && body.description.length > 1000) {
      return NextResponse.json({ error: '説明は1000文字以内で入力してください' }, { status: 400 });
    }

    // スケジュール候補のバリデーション
    if (body.schedule_candidates) {
      for (const schedule of body.schedule_candidates) {
        if (schedule.day_of_week < 0 || schedule.day_of_week > 6) {
          return NextResponse.json({ error: '無効な曜日が指定されています' }, { status: 400 });
        }

        // 時間形式の検証 (HH:MM)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(schedule.start_time) || !timeRegex.test(schedule.end_time)) {
          return NextResponse.json(
            { error: '時間は HH:MM 形式で入力してください' },
            { status: 400 }
          );
        }

        // 開始時間が終了時間より前であることを確認
        if (schedule.start_time >= schedule.end_time) {
          return NextResponse.json(
            { error: '開始時間は終了時間より前である必要があります' },
            { status: 400 }
          );
        }
      }
    }

    // 招待URLを生成
    const inviteCode = generateInviteCode();
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reading-circles/join/${inviteCode}`;

    // トランザクション開始
    const { data: bookclub, error: createError } = await supabase
      .from('bookclubs')
      .insert([
        {
          title: body.title.trim(),
          purpose: body.purpose?.trim(),
          description: body.description?.trim(),
          book_id: null, // 後で書籍候補から設定
          status: 'recruiting',
          invite_url: inviteUrl,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    console.log('bookclub作成結果:', {
      success: !createError,
      error: createError?.message,
      code: createError?.code,
      details: createError?.details,
      userId: user.id,
      bookclubData: bookclub,
    });

    if (createError) {
      console.error('Error creating bookclub:', createError);
      return NextResponse.json(
        { error: `読書会の作成に失敗しました: ${createError.message}` },
        { status: 500 }
      );
    }

    // 作成者をメンバーとして追加
    const { error: memberError } = await supabase.from('bookclub_members').insert([
      {
        bookclub_id: bookclub.id,
        user_id: user.id,
        role: 'organizer',
      },
    ]);

    if (memberError) {
      console.error('Error adding organizer as member:', memberError);
      // 読書会を削除してロールバック
      await supabase.from('bookclubs').delete().eq('id', bookclub.id);
      return NextResponse.json(
        { error: `メンバー追加に失敗しました: ${memberError.message}` },
        { status: 500 }
      );
    }

    // 読書会設定を追加
    console.log('bookclub_settings挿入前のチェック:', {
      bookclub_id: bookclub.id,
      user_id: user.id,
      settingsData: {
        bookclub_id: bookclub.id,
        max_participants: body.max_participants || 10,
        is_public: body.is_public !== false,
        requires_approval: body.requires_approval || false,
      },
    });

    const { error: settingsError } = await supabase.from('bookclub_settings').insert([
      {
        bookclub_id: bookclub.id,
        max_participants: body.max_participants || 10,
        is_public: body.is_public !== false,
        requires_approval: body.requires_approval || false,
        settings_json: {},
      },
    ]);

    if (settingsError) {
      console.error('Error creating bookclub settings:', {
        error: settingsError,
        message: settingsError?.message,
        code: settingsError?.code,
        details: settingsError?.details,
        hint: settingsError?.hint,
      });

      // ロールバック処理
      await supabase.from('bookclub_members').delete().eq('bookclub_id', bookclub.id);
      await supabase.from('bookclubs').delete().eq('id', bookclub.id);
      return NextResponse.json(
        { error: `読書会設定の作成に失敗しました: ${settingsError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // 書籍候補の処理
    if (body.book_candidates && body.book_candidates.length > 0) {
      console.log('書籍候補の追加:', {
        bookclub_id: bookclub.id,
        book_candidates: body.book_candidates,
        book_candidates_types: body.book_candidates.map((id: string | number) => typeof id),
      });

      // 選択された書籍の詳細情報を取得
      const selectedBooks = body.selected_books || [];

      // 書籍をデータベースに保存して数値IDを取得
      const bookIdMapping = new Map<string, number>();

      for (const selectedBook of selectedBooks) {
        try {
          console.log(
            `Processing book: ${selectedBook.title} (ID: ${selectedBook.id}, ISBN: ${selectedBook.isbn})`
          );

          // まずISBNで既存の書籍を検索
          let existingBook = null;
          if (selectedBook.isbn) {
            const { data: isbnBook, error: isbnError } = await supabase
              .from('books')
              .select('id')
              .eq('isbn', selectedBook.isbn)
              .single();

            if (!isbnError && isbnBook) {
              existingBook = isbnBook;
              console.log(
                `Found existing book by ISBN: ${selectedBook.isbn}, DB ID: ${isbnBook.id}`
              );
            }
          }

          // ISBNで見つからない場合はタイトルと著者で検索
          if (!existingBook && selectedBook.title && selectedBook.author) {
            const { data: titleBook, error: titleError } = await supabase
              .from('books')
              .select('id')
              .eq('title', selectedBook.title)
              .eq('author', selectedBook.author)
              .single();

            if (!titleError && titleBook) {
              existingBook = titleBook;
              console.log(
                `Found existing book by title/author: ${selectedBook.title}, DB ID: ${titleBook.id}`
              );
            }
          }

          // 既存の書籍が見つからない場合は新規保存
          if (!existingBook) {
            console.log(`Saving new book: ${selectedBook.title}`);

            const bookToSave = {
              isbn:
                selectedBook.isbn ||
                `N-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              title: selectedBook.title,
              author: selectedBook.author || '不明',
              language: selectedBook.language || '日本語',
              categories: selectedBook.categories || [],
              img_url: selectedBook.img_url || '',
              description: selectedBook.description || '',
              programming_languages: selectedBook.programmingLanguages || [],
              frameworks: selectedBook.frameworks || [],
            };

            const { data: newBook, error: saveError } = await supabase
              .from('books')
              .insert([bookToSave])
              .select('id')
              .single();

            if (saveError) {
              console.error(`Failed to save book ${selectedBook.title}:`, saveError);
              continue;
            }

            existingBook = newBook;
            console.log(`Saved new book: ${selectedBook.title}, DB ID: ${newBook.id}`);
          }

          // マッピングに追加
          bookIdMapping.set(selectedBook.id, existingBook.id);
        } catch (error) {
          console.error(`Error processing book ${selectedBook.id}:`, error);
        }
      }

      // 数値IDを使用して書籍候補を保存
      const validBookIds: number[] = [];
      for (const candidateId of body.book_candidates) {
        const candidateIdStr = String(candidateId);
        const dbId = bookIdMapping.get(candidateIdStr);
        if (dbId) {
          validBookIds.push(dbId);
        }
      }

      console.log('Valid book IDs for candidates:', validBookIds);

      if (validBookIds.length > 0) {
        const bookCandidatesData = validBookIds.map((bookId, index) => ({
          bookclub_id: bookclub.id,
          book_id: bookId,
          is_selected: index === 0, // 最初の書籍を選択状態にする
        }));

        const { error: candidatesError } = await supabase
          .from('bookclub_book_candidates')
          .insert(bookCandidatesData);

        if (candidatesError) {
          console.error('書籍候補の追加エラー:', candidatesError);
          throw candidatesError;
        }

        console.log('書籍候補を正常に追加しました');
      } else {
        console.log('No valid book IDs found, skipping book candidates');
      }
    }

    // スケジュール候補を追加
    if (body.schedule_candidates && body.schedule_candidates.length > 0) {
      const scheduleInserts = body.schedule_candidates.map(schedule => ({
        bookclub_id: bookclub.id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
      }));

      const { error: scheduleError } = await supabase
        .from('bookclub_schedule_candidates')
        .insert(scheduleInserts);

      if (scheduleError) {
        console.error('Error adding schedule candidates:', scheduleError);
        // ロールバック処理
        await supabase.from('bookclub_settings').delete().eq('bookclub_id', bookclub.id);
        await supabase.from('bookclub_members').delete().eq('bookclub_id', bookclub.id);
        await supabase.from('bookclubs').delete().eq('id', bookclub.id);
        return NextResponse.json(
          { error: `スケジュール候補の追加に失敗しました: ${scheduleError.message}` },
          { status: 500 }
        );
      }
    }

    // レスポンス用データを準備
    const response: ReadingCircleResponse = {
      id: bookclub.id,
      title: bookclub.title,
      purpose: bookclub.purpose,
      description: bookclub.description,
      status: bookclub.status,
      invite_url: bookclub.invite_url,
      created_by: bookclub.created_by,
      created_at: bookclub.created_at,
      member_count: 1,
      max_participants: body.max_participants || 10,
      book_candidates: body.book_candidates,
      schedule_candidates: body.schedule_candidates,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Reading circle creation error:', error);
    // エラーオブジェクトの詳細な情報を出力
    const errorDetails = {
      message: error instanceof Error ? error.message : '不明なエラー',
      stack: error instanceof Error ? error.stack : undefined,
      details: error,
    };
    console.error('Error details:', errorDetails);

    // エラーメッセージを適切に返す
    const errorMessage = error instanceof Error ? error.message : '読書会の作成に失敗しました';

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}

// 読書会一覧取得API
export async function GET(request: NextRequest) {
  try {
    const supabase = createApiRouteSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase.from('bookclubs').select(`
      *,
      bookclub_members(count),
      bookclub_settings(max_participants, is_public),
      bookclub_schedule_candidates(*),
      bookclub_book_candidates(
        book_id,
        is_selected,
        books(
          id,
          title,
          author,
          img_url
        )
      )
    `);

    // ステータスフィルター
    if (status && ['recruiting', 'in-progress', 'completed'].includes(status)) {
      query = query.eq('status', status);
    }

    // 公開設定フィルター（ユーザーIDが指定されていない場合は公開のみ）
    if (!userId) {
      query = query.eq('bookclub_settings.is_public', true);
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: bookclubs, error } = await query;

    if (error) {
      console.error('Error fetching bookclubs:', error);
      return NextResponse.json({ error: '読書会の取得に失敗しました' }, { status: 500 });
    }

    const formattedBookclubs =
      bookclubs?.map(bookclub => ({
        id: bookclub.id,
        title: bookclub.title,
        purpose: bookclub.purpose,
        description: bookclub.description,
        status: bookclub.status,
        invite_url: bookclub.invite_url,
        created_by: bookclub.created_by,
        created_at: bookclub.created_at,
        member_count: Array.isArray(bookclub.bookclub_members)
          ? bookclub.bookclub_members.length
          : 0,
        max_participants: bookclub.bookclub_settings?.[0]?.max_participants || 10,
        is_public: bookclub.bookclub_settings?.[0]?.is_public || true,
        schedule_candidates: bookclub.bookclub_schedule_candidates || [],
        book_candidates:
          bookclub.bookclub_book_candidates?.map((bc: { book_id: number }) => bc.book_id) || [],
      })) || [];

    return NextResponse.json({ bookclubs: formattedBookclubs });
  } catch (error) {
    console.error('Reading circles fetch error:', error);
    return NextResponse.json({ error: '読書会の取得に失敗しました' }, { status: 500 });
  }
}

// 招待コード生成関数
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
