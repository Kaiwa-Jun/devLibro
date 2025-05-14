-- migrations/003_add_programming_languages.sql

-- プログラミング言語と関連フレームワークのカラムを追加
ALTER TABLE books ADD COLUMN IF NOT EXISTS programming_languages TEXT[] DEFAULT '{}';
ALTER TABLE books ADD COLUMN IF NOT EXISTS frameworks TEXT[] DEFAULT '{}';

-- 検索用インデックスを作成
CREATE INDEX IF NOT EXISTS idx_books_programming_languages ON books USING gin (programming_languages);
CREATE INDEX IF NOT EXISTS idx_books_frameworks ON books USING gin (frameworks);

-- 既存データの更新のためのヘルパー関数
-- タイトル、説明文、カテゴリからプログラミング言語を推測
CREATE OR REPLACE FUNCTION extract_programming_languages_and_frameworks()
RETURNS VOID AS $$
DECLARE
    book_record RECORD;
    detected_languages TEXT[];
    detected_frameworks TEXT[];
    lang TEXT;
    framework TEXT;
BEGIN
    -- 言語とフレームワークのマスターリスト
    -- 言語リスト（RとCを除外）
    DECLARE languages TEXT[] := ARRAY[
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go',
        'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Scala', 'Haskell',
        'Perl', 'COBOL', 'Fortran', 'Assembly', 'Lua', 'Groovy', 'Clojure',
        'F#', 'Julia', 'Shell', 'PowerShell', 'SQL'
    ];

    -- フレームワークリスト
    DECLARE frameworks TEXT[] := ARRAY[
        -- JavaScript/TypeScriptフレームワーク
        'React', 'Angular', 'Vue', 'Next.js', 'Nuxt.js', 'Express', 'Nest.js',
        'Node.js', 'Svelte', 'Ember.js', 'Astro', 'jQuery',
        -- Pythonフレームワーク
        'Django', 'Flask', 'FastAPI', 'Pyramid', 'Tornado',
        -- Javaフレームワーク
        'Spring', 'Spring Boot', 'Jakarta EE', 'Hibernate', 'Quarkus',
        -- PHPフレームワーク
        'Laravel', 'Symfony', 'CodeIgniter', 'CakePHP', 'Yii',
        -- Rubyフレームワーク
        'Ruby on Rails', 'Sinatra', 'Hanami', 'Grape',
        -- その他
        'ASP.NET', '.NET Core', 'Flutter', 'SwiftUI', 'Vapor', 'Gin', 'Echo'
    ];

    -- すべての書籍に対して処理
    FOR book_record IN SELECT id, title, description, categories FROM books
    LOOP
        detected_languages := '{}';
        detected_frameworks := '{}';

        -- R言語とC言語の特別処理
        -- C言語の検出（タイトルに明示的に含まれる場合のみ）
        IF
            book_record.title ILIKE '%c言語%' OR
            book_record.title ILIKE '%cプログラミング%' OR
            book_record.title ILIKE '%c プログラミング%'
        THEN
            detected_languages := array_append(detected_languages, 'C');
        END IF;

        -- R言語の検出（タイトルに明示的に含まれる場合のみ）
        IF
            book_record.title ILIKE '%r言語%' OR
            book_record.title ILIKE '%rプログラミング%' OR
            book_record.title ILIKE '%r プログラミング%'
        THEN
            detected_languages := array_append(detected_languages, 'R');
        END IF;

        -- タイトルから言語を検出
        FOREACH lang IN ARRAY languages
        LOOP
            IF book_record.title ILIKE '%' || lang || '%' THEN
                detected_languages := array_append(detected_languages, lang);
            END IF;
        END LOOP;

        -- タイトルからフレームワークを検出
        FOREACH framework IN ARRAY frameworks
        LOOP
            IF book_record.title ILIKE '%' || framework || '%' THEN
                detected_frameworks := array_append(detected_frameworks, framework);
            END IF;
        END LOOP;

        -- カテゴリから言語とフレームワークを検出
        IF book_record.categories IS NOT NULL THEN
            FOREACH lang IN ARRAY languages
            LOOP
                IF lang = ANY(book_record.categories) OR
                   EXISTS (SELECT 1 FROM unnest(book_record.categories) cat WHERE cat ILIKE '%' || lang || '%') THEN
                    detected_languages := array_append(detected_languages, lang);
                END IF;
            END LOOP;

            FOREACH framework IN ARRAY frameworks
            LOOP
                IF framework = ANY(book_record.categories) OR
                   EXISTS (SELECT 1 FROM unnest(book_record.categories) cat WHERE cat ILIKE '%' || framework || '%') THEN
                    detected_frameworks := array_append(detected_frameworks, framework);
                END IF;
            END LOOP;
        END IF;

        -- 説明文から言語とフレームワークを検出
        IF book_record.description IS NOT NULL THEN
            FOREACH lang IN ARRAY languages
            LOOP
                IF book_record.description ILIKE '%' || lang || '%' THEN
                    detected_languages := array_append(detected_languages, lang);
                END IF;
            END LOOP;

            FOREACH framework IN ARRAY frameworks
            LOOP
                IF book_record.description ILIKE '%' || framework || '%' THEN
                    detected_frameworks := array_append(detected_frameworks, framework);
                END IF;
            END LOOP;
        END IF;

        -- 重複を削除
        detected_languages := ARRAY(SELECT DISTINCT UNNEST(detected_languages));
        detected_frameworks := ARRAY(SELECT DISTINCT UNNEST(detected_frameworks));

        -- 書籍レコードを更新
        UPDATE books
        SET programming_languages = detected_languages,
            frameworks = detected_frameworks
        WHERE id = book_record.id;
    END LOOP;

    RAISE NOTICE '既存の書籍データの言語・フレームワーク抽出処理が完了しました';
END;
$$ LANGUAGE plpgsql;

-- 既存データの更新を実行
SELECT extract_programming_languages_and_frameworks();