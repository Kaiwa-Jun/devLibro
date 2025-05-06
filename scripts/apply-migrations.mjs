// 既存のマイグレーションの適用とプログラミング言語データの更新を行うスクリプト
// Node.js環境で実行することを想定しています

import fs from 'fs';
import path from 'path';

import { createClient } from '@supabase/supabase-js';
// 環境変数の読み込み
import dotenv from 'dotenv';
dotenv.config();

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYが必要です');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// マイグレーションファイルのパス
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// マイグレーションファイルを読み込む
async function readMigrationFile(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`マイグレーションファイルの読み込みに失敗しました: ${filename}`, error);
    return null;
  }
}

// SQLを実行する
async function executeSQL(sql) {
  if (!sql) return false;

  try {
    // PostgreSQLのrpc機能を使用してSQLを実行
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('SQL実行エラー:', error);
      return false;
    }

    console.log('SQL実行成功:', data);
    return true;
  } catch (error) {
    console.error('SQL実行時の例外:', error);
    return false;
  }
}

// マイグレーションを適用する
async function applyMigration(filename) {
  console.log(`マイグレーションを適用します: ${filename}`);
  const sql = await readMigrationFile(filename);
  if (await executeSQL(sql)) {
    console.log(`マイグレーション成功: ${filename}`);
    return true;
  } else {
    console.error(`マイグレーション失敗: ${filename}`);
    return false;
  }
}

// 手動で実行するマイグレーション：既存の書籍データにプログラミング言語情報を追加
async function updateExistingBooks() {
  console.log('既存の書籍にプログラミング言語情報を追加します...');

  try {
    // すべての書籍を取得
    const { data: books, error } = await supabase.from('books').select('*');

    if (error) {
      console.error('書籍の取得エラー:', error);
      return false;
    }

    console.log(`${books.length}冊の書籍を処理します`);

    // 言語リスト
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
      'R',
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

    // フレームワークリスト
    const frameworks = [
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
      'Django',
      'Flask',
      'FastAPI',
      'Pyramid',
      'Tornado',
      'Spring',
      'Spring Boot',
      'Jakarta EE',
      'Hibernate',
      'Quarkus',
      'Laravel',
      'Symfony',
      'CodeIgniter',
      'CakePHP',
      'Yii',
      'Ruby on Rails',
      'Sinatra',
      'Hanami',
      'Grape',
      'ASP.NET',
      '.NET Core',
      'Flutter',
      'SwiftUI',
      'Vapor',
      'Gin',
      'Echo',
    ];

    // 各書籍を処理
    for (const book of books) {
      const detectedLanguages = [];
      const detectedFrameworks = [];

      // タイトルから言語を検出
      for (const lang of languages) {
        if (book.title && book.title.toLowerCase().includes(lang.toLowerCase())) {
          detectedLanguages.push(lang);
        }
      }

      // タイトルからフレームワークを検出
      for (const framework of frameworks) {
        if (book.title && book.title.toLowerCase().includes(framework.toLowerCase())) {
          detectedFrameworks.push(framework);
        }
      }

      // カテゴリから言語とフレームワークを検出
      if (book.categories && Array.isArray(book.categories)) {
        for (const category of book.categories) {
          for (const lang of languages) {
            if (category.toLowerCase().includes(lang.toLowerCase())) {
              detectedLanguages.push(lang);
            }
          }

          for (const framework of frameworks) {
            if (category.toLowerCase().includes(framework.toLowerCase())) {
              detectedFrameworks.push(framework);
            }
          }
        }
      }

      // 説明文から言語とフレームワークを検出
      if (book.description) {
        for (const lang of languages) {
          if (book.description.toLowerCase().includes(lang.toLowerCase())) {
            detectedLanguages.push(lang);
          }
        }

        for (const framework of frameworks) {
          if (book.description.toLowerCase().includes(framework.toLowerCase())) {
            detectedFrameworks.push(framework);
          }
        }
      }

      // 重複を削除
      const uniqueLanguages = [...new Set(detectedLanguages)];
      const uniqueFrameworks = [...new Set(detectedFrameworks)];

      // 更新
      if (uniqueLanguages.length > 0 || uniqueFrameworks.length > 0) {
        console.log(`書籍ID ${book.id}「${book.title}」を更新:`, {
          languages: uniqueLanguages,
          frameworks: uniqueFrameworks,
        });

        const { error: updateError } = await supabase
          .from('books')
          .update({
            programming_languages: uniqueLanguages,
            frameworks: uniqueFrameworks,
          })
          .eq('id', book.id);

        if (updateError) {
          console.error(`書籍ID ${book.id}の更新エラー:`, updateError);
        }
      }
    }

    console.log('すべての書籍の処理が完了しました');
    return true;
  } catch (error) {
    console.error('書籍データの更新中にエラーが発生しました:', error);
    return false;
  }
}

// メイン処理
async function main() {
  try {
    // マイグレーションファイルを適用
    await applyMigration('003_add_programming_languages.sql');

    // プログラミング言語情報を手動で更新
    await updateExistingBooks();

    console.log('すべての処理が完了しました');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトの実行
main();
