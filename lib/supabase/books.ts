import { createClient } from '@supabase/supabase-js';

import { mockBooks } from '@/lib/mock-data';
import { Book } from '@/types';

// クライアントサイドでのみ Supabase クライアントを初期化
let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  // 既存のクライアントがあれば再利用
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials are not provided in environment variables');
  }

  // 新しいクライアントを作成し、保存して再利用
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
};

// データベースから書籍をタイトルで検索
export const searchBooksByTitleInDB = async (title: string, limit = 10): Promise<Book[]> => {
  try {
    const supabase = getSupabaseClient();

    console.log(`タイトルで書籍を検索: "${title}" (最大${limit}件)`);

    // ilike を使用して部分一致検索（大文字小文字を区別しない）
    // また、言語が日本語の書籍のみを取得
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .ilike('title', `%${title}%`)
      .or('language.eq.日本語,language.eq.ja')
      .limit(limit);

    if (error) {
      console.error('タイトルでの書籍検索エラー:', error);
      return [];
    }

    console.log(`${data?.length || 0}件の日本語書籍が見つかりました`);
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

// エラー情報を含むBook型
export type BookWithError = Book & {
  error: {
    code: string;
    message: string;
  };
};

// user_idフィールドを含むBook型
export type BookWithUserId = {
  user_id: string;
  id: string;
  isbn: string;
  title: string;
  author: string;
  language: string;
  categories: string[];
  img_url: string;
  avg_difficulty: number;
  description?: string;
  programmingLanguages?: string[];
  frameworks?: string[];
  publisherName?: string;
  itemUrl?: string;
};

// 書籍をデータベースに保存
export const saveBookToDB = async (book: Book): Promise<Book | null> => {
  try {
    const supabase = getSupabaseClient();

    // 不正なデータをサニタイズ
    const sanitizeString = (str: string | undefined | null): string => {
      if (!str) return '';
      // 文字列が長すぎる場合は切り詰める（データベースの制約に合わせる）
      return str.slice(0, 2000);
    };

    // 既存の書籍をチェック（ISBNまたはIDで）
    const { data: books, error: selectError } = await supabase
      .from('books')
      .select('*')
      .or(`isbn.eq.${book.isbn || 'null'},id.eq.${book.id}`)
      .limit(1);

    if (selectError) {
      console.error('書籍検索エラー:', selectError);
      throw selectError;
    }

    // 既存の書籍が見つかった場合はそれを返す
    if (books && books.length > 0) {
      console.log('既存の書籍が見つかりました:', books[0]);
      return books[0] as Book;
    }

    // プログラミング言語とフレームワークを検出
    const programmingLanguages = await detectProgrammingLanguagesFromBook(book);
    const frameworks = await detectFrameworksFromBook(book);

    // ISBNが無い場合の一意識別子の生成（より確実な方法）
    const timestamp = Date.now();
    const uniqueId =
      'N-' +
      timestamp.toString().slice(-6) +
      Math.random().toString(36).slice(2, 6) +
      (book.id ? book.id.slice(0, 5) : '');

    // テーブル構造に合わせたデータを準備
    const bookToSave = {
      // ISBNがない場合は短い一意識別子を生成（20文字以内）
      isbn: book.isbn || uniqueId,
      title: sanitizeString(book.title),
      author: sanitizeString(book.author) || '不明',
      language: book.language || '日本語',
      categories: book.categories || [],
      img_url: book.img_url || '',
      description: sanitizeString(book.description || ''),
      // Google Books IDを説明文に含めておく（検索用）
      ...(book.id && {
        description: `[GBID:${book.id}] ${sanitizeString(book.description || '')}`,
      }),
      // 新フィールド
      programming_languages: programmingLanguages,
      frameworks: frameworks,
    };

    console.log('保存する書籍データ:', bookToSave);

    // RLSエラー回避: 認証状態を確認
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    // user_idフィールドがあるかどうかを確認するためのクエリを実行
    let hasUserIdColumn = false;
    try {
      // この段階で明示的にuser_idカラムの確認を行う
      console.log('user_idカラムの存在確認を試みます');

      // まず直接保存を試みてエラーをトラップする方が確実
      const testBook = {
        ...bookToSave,
        user_id: 'test-user-id',
        // 既存レコードと重複しないよう一時的な値を使用
        isbn: `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        title: `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      };

      const { error: testError } = await supabase
        .from('books')
        .insert([testBook])
        .select()
        .limit(1);

      // カラムがある場合はエラーがないか、または別のエラー（一意制約など）の可能性がある
      if (!testError || (testError && testError.code !== 'PGRST204')) {
        console.log('user_idカラムは存在します');
        hasUserIdColumn = true;
      } else {
        console.log('user_idカラムが存在しません:', testError);
      }

      // テスト用のレコードを削除（挿入に成功した場合のみ）
      if (!testError) {
        await supabase.from('books').delete().eq('isbn', testBook.isbn);
      }
    } catch (tableError) {
      console.warn('user_idカラムの確認中にエラーが発生しました:', tableError);
      // エラーがあった場合でもとりあえず保存を試みる
    }

    // 認証されたユーザーがいるか確認
    if (!session) {
      console.error('認証されていません。書籍の保存にはログインが必要です。');

      // user_idがないテーブルの場合は、そのまま保存を試みる
      if (!hasUserIdColumn) {
        console.log('user_idフィールドがないため、認証なしで保存を試みます');
        try {
          const { data: anonymousData, error: anonymousError } = await supabase
            .from('books')
            .insert([bookToSave])
            .select()
            .single();

          if (anonymousError) {
            console.error('認証なしでの書籍保存エラー:', anonymousError);
            return {
              ...book,
              error: {
                code: anonymousError.code || 'UNKNOWN_ERROR',
                message: anonymousError.message || '書籍の保存中に不明なエラーが発生しました。',
              },
            } as BookWithError;
          }

          console.log('認証なしで書籍が正常に保存されました:', anonymousData);
          return formatBookFromDB(anonymousData);
        } catch (anonymousSaveError) {
          console.error('認証なしでの書籍保存の例外:', anonymousSaveError);
          return {
            ...book,
            error: {
              code: 'EXCEPTION',
              message:
                anonymousSaveError instanceof Error
                  ? anonymousSaveError.message
                  : '不明な例外が発生しました',
            },
          } as BookWithError;
        }
      }

      // user_idフィールドがある場合は、エラーを返す
      return {
        ...book,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: '認証されていません。書籍の保存にはログインが必要です。',
        },
      } as BookWithError;
    }

    // ユーザーIDを追加して保存（RLSポリシーに対応）- user_idフィールドがある場合のみ
    const bookWithUserId = hasUserIdColumn
      ? { ...bookToSave, user_id: session.user.id }
      : bookToSave;

    console.log('保存する最終的な書籍データ:', bookWithUserId);

    // 新しい書籍を挿入
    const { data, error } = await supabase.from('books').insert([bookWithUserId]).select().single();

    if (error) {
      console.error('書籍保存エラー:', error);

      // セキュリティポリシーエラーの場合の特別なハンドリング
      if (error.code === '42501') {
        console.error('行レベルセキュリティポリシー違反。公開APIを使用します。');

        // フロントエンドでエラーハンドリングするため、エラーを明示的にマークしたオブジェクトを返す
        return {
          ...book,
          error: {
            code: error.code,
            message: 'セキュリティポリシーにより書籍の保存が制限されています。',
          },
        } as BookWithError;
      }

      // user_idカラムが見つからないエラーの場合、user_idなしで再度試みる
      if (error.code === 'PGRST204' && error.message.includes('user_id')) {
        console.log('user_idカラムが見つからないため、user_idなしで再度保存を試みます');

        // user_idフィールドを除いた新しいオブジェクトを作成
        const bookWithoutUserId: Record<string, unknown> = {};
        Object.keys(bookWithUserId).forEach(key => {
          if (key !== 'user_id') {
            bookWithoutUserId[key as keyof typeof bookWithUserId] =
              bookWithUserId[key as keyof typeof bookWithUserId];
          }
        });

        try {
          const { data: retryData, error: retryError } = await supabase
            .from('books')
            .insert([bookWithoutUserId])
            .select()
            .single();

          if (retryError) {
            console.error('user_idなしでの保存再試行エラー:', retryError);
            return {
              ...book,
              error: {
                code: retryError.code || 'RETRY_ERROR',
                message: retryError.message || 'user_idなしでの保存再試行に失敗しました。',
              },
            } as BookWithError;
          }

          console.log('user_idなしで書籍が正常に保存されました:', retryData);
          return formatBookFromDB(retryData);
        } catch (retryException) {
          console.error('user_idなしでの保存再試行例外:', retryException);
        }
      }

      // その他のエラーの場合も、フロントエンドでのハンドリングのためにエラー情報を返す
      return {
        ...book,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || '書籍の保存中に不明なエラーが発生しました。',
        },
      } as BookWithError;
    }

    console.log('書籍が正常に保存されました:', data);
    return formatBookFromDB(data);
  } catch (error) {
    console.error('saveBookToDB内でエラー発生:', error);

    // 例外が発生した場合も、フロントエンドでのハンドリングのためにエラー情報を返す
    return {
      ...book,
      error: {
        code: 'EXCEPTION',
        message: error instanceof Error ? error.message : '不明な例外が発生しました',
      },
    } as BookWithError;
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

        // 重複防止のため、この時点で保存済みフラグを確認
        const savedFlag = sessionStorage.getItem(`book_${id}_saved`);
        if (!savedFlag) {
          // まだ保存されていないフラグがセットされていなければ設定
          sessionStorage.setItem(`book_${id}_saved`, 'pending');
        }
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
        // 保存済みフラグを確実に設定
        sessionStorage.setItem(`book_${id}_saved`, 'true');
        return formatBookFromDB(isbnData[0]);
      }
    }

    // タイトルで検索 (セッションストレージからタイトルがある場合)
    if (storedBookData?.title) {
      const { data: titleData, error: titleError } = await supabase
        .from('books')
        .select('*')
        .eq('title', storedBookData.title)
        .eq('author', storedBookData.author || '不明');

      if (!titleError && titleData && titleData.length > 0) {
        console.log('タイトルと著者で書籍が見つかりました:', titleData[0]);
        // 保存済みフラグを確実に設定
        sessionStorage.setItem(`book_${id}_saved`, 'true');
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
    programmingLanguages: Array.isArray(data.programming_languages)
      ? data.programming_languages.map(String)
      : [],
    frameworks: Array.isArray(data.frameworks) ? data.frameworks.map(String) : [],
  };
}

// すべての書籍をデータベースから取得
export const getAllBooksFromDB = async (): Promise<Book[]> => {
  try {
    const supabase = getSupabaseClient();

    console.log('すべての書籍をデータベースから取得しています...');

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .or('language.eq.日本語,language.eq.ja') // 日本語の書籍のみを取得
      .order('id', { ascending: false })
      .limit(100);

    if (error) {
      console.error('すべての書籍の取得エラー:', error);
      return [];
    }

    console.log(`${data?.length || 0}件の日本語書籍を取得しました`);
    // 取得したデータを適切な形式に変換
    return (data || []).map(book => formatBookFromDB(book));
  } catch (error) {
    console.error('getAllBooksFromDB内でエラー発生:', error);
    return [];
  }
};

// プログラミング言語を検出する関数
async function detectProgrammingLanguagesFromBook(book: Book): Promise<string[]> {
  // プログラミング言語リスト
  const languages = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'C#',
    'Go',
    'Rust',
    'Ruby',
    'PHP',
    'Swift',
    'Kotlin',
    'Dart',
    'Scala',
    'Haskell',
    'Perl',
    // RとCは特別扱いするため、ここでは削除
    'COBOL',
    'Fortran',
    'Assembly',
    'Lua',
    'Groovy',
    'Clojure',
    'F#',
    'Julia',
    'Shell',
    'PowerShell',
    'SQL',
  ];

  const detectedLanguages = new Set<string>();

  // R言語とC言語の特別処理
  const lowerTitle = book.title.toLowerCase();
  // C言語の条件
  if (
    lowerTitle.includes('c言語') ||
    lowerTitle.includes('cプログラミング') ||
    lowerTitle.includes('c プログラミング')
  ) {
    detectedLanguages.add('C');
  }

  // R言語の条件
  if (
    lowerTitle.includes('r言語') ||
    lowerTitle.includes('rプログラミング') ||
    lowerTitle.includes('r プログラミング')
  ) {
    detectedLanguages.add('R');
  }

  // タイトルから検出
  for (const lang of languages) {
    if (book.title.includes(lang)) {
      detectedLanguages.add(lang);
    }
  }

  // カテゴリから検出
  for (const category of book.categories) {
    for (const lang of languages) {
      if (category.includes(lang)) {
        detectedLanguages.add(lang);
      }
    }
  }

  // 説明文から検出
  if (book.description) {
    for (const lang of languages) {
      if (book.description.includes(lang)) {
        detectedLanguages.add(lang);
      }
    }
  }

  return Array.from(detectedLanguages);
}

// フレームワークを検出する関数
async function detectFrameworksFromBook(book: Book): Promise<string[]> {
  // フレームワークリスト
  const frameworks = [
    // JavaScript/TypeScriptフレームワーク
    'React',
    'Angular',
    'Vue',
    'Next.js',
    'Nuxt.js',
    'Express',
    'Nest.js',
    'Node.js',
    'Svelte',
    'Ember.js',
    'Astro',
    'jQuery',
    // Pythonフレームワーク
    'Django',
    'Flask',
    'FastAPI',
    'Pyramid',
    'Tornado',
    // Javaフレームワーク
    'Spring',
    'Spring Boot',
    'Jakarta EE',
    'Hibernate',
    'Quarkus',
    // PHPフレームワーク
    'Laravel',
    'Symfony',
    'CodeIgniter',
    'CakePHP',
    'Yii',
    // Rubyフレームワーク
    'Ruby on Rails',
    'Sinatra',
    'Hanami',
    'Grape',
    // その他
    'ASP.NET',
    '.NET Core',
    'Flutter',
    'SwiftUI',
    'Vapor',
    'Gin',
    'Echo',
  ];

  const detectedFrameworks = new Set<string>();

  // タイトルから検出
  for (const framework of frameworks) {
    if (book.title.includes(framework)) {
      detectedFrameworks.add(framework);
    }
  }

  // カテゴリから検出
  for (const category of book.categories) {
    for (const framework of frameworks) {
      if (category.includes(framework)) {
        detectedFrameworks.add(framework);
      }
    }
  }

  // 説明文から検出
  if (book.description) {
    for (const framework of frameworks) {
      if (book.description.includes(framework)) {
        detectedFrameworks.add(framework);
      }
    }
  }

  return Array.from(detectedFrameworks);
}

// 書籍のISBNを更新する関数
export const updateBookISBN = async (bookId: string | number, isbn: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();

    console.log(`書籍ID:${bookId}のISBNを"${isbn}"に更新します`);

    const { error } = await supabase.from('books').update({ isbn }).eq('id', bookId);

    if (error) {
      console.error('書籍のISBN更新エラー:', error);
      return false;
    }

    console.log(`書籍ID:${bookId}のISBNを正常に更新しました`);
    return true;
  } catch (error) {
    console.error('updateBookISBN内でエラー発生:', error);
    return false;
  }
};
