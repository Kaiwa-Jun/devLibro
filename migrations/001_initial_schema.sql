-- migrations/001_initial_schema.sql

-- テーブル作成前にロールバック用のDROP文
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS user_books CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS book_status_enum CASCADE;
DROP TYPE IF EXISTS display_type_enum CASCADE;

-- ENUMタイプの作成
CREATE TYPE book_status_enum AS ENUM ('unread', 'reading', 'done');
CREATE TYPE display_type_enum AS ENUM ('anon', 'user', 'custom');

-- booksテーブル
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL, -- ISO 639-1 コード (例: "ja", "en")
    categories TEXT[] DEFAULT '{}', -- 配列型
    img_url TEXT,
    description TEXT,
    publisher VARCHAR(255),
    published_at DATE,
    page_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 検索用インデックス
CREATE INDEX idx_books_title ON books USING gin (to_tsvector('english', title));
CREATE INDEX idx_books_author ON books USING gin (to_tsvector('english', author));
CREATE INDEX idx_books_language ON books (language);
CREATE INDEX idx_books_categories ON books USING gin (categories);

-- usersテーブル（Supabaseのauthと連携）
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Supabase Auth連携
    display_name VARCHAR(100) NOT NULL,
    experience_years DECIMAL(4,1) NOT NULL DEFAULT 0,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- レビューテーブル
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    comment TEXT,
    display_type display_type_enum NOT NULL DEFAULT 'anon',
    custom_pen_name VARCHAR(100),
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- ユーザー1人につき書籍1冊あたり1レビューの制約
    CONSTRAINT unique_user_book_review UNIQUE (user_id, book_id)
);

-- レビュー検索・集計用インデックス
CREATE INDEX idx_reviews_book_id ON reviews (book_id);
CREATE INDEX idx_reviews_user_id ON reviews (user_id);
CREATE INDEX idx_reviews_difficulty ON reviews (difficulty);
CREATE INDEX idx_reviews_created_at ON reviews (created_at);

-- ユーザーの蔵書管理テーブル
CREATE TABLE user_books (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    status book_status_enum NOT NULL DEFAULT 'unread',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    CONSTRAINT unique_user_book UNIQUE (user_id, book_id)
);

-- 蔵書検索用インデックス
CREATE INDEX idx_user_books_user_id ON user_books (user_id);
CREATE INDEX idx_user_books_book_id ON user_books (book_id);
CREATE INDEX idx_user_books_status ON user_books (status);
CREATE INDEX idx_user_books_added_at ON user_books (added_at);
CREATE INDEX idx_user_books_finished_at ON user_books (finished_at);

-- 自動的にupdated_atを更新する関数とトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルに更新日時トリガーを設定
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON books
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLSポリシー設定（Supabase用）
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;

-- 書籍は誰でも閲覧可能
CREATE POLICY "Books are viewable by everyone" ON books
    FOR SELECT USING (true);

-- 自分のユーザー情報のみ更新可能
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- レビューは誰でも閲覧可能、自分のレビューのみ編集可能
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- 自分の蔵書のみ管理可能
CREATE POLICY "Users can view own books" ON user_books
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books" ON user_books
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books" ON user_books
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" ON user_books
    FOR DELETE USING (auth.uid() = user_id);

-- コメント: 必要に応じて初期データを追加