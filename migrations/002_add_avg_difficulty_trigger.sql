-- migrations/002_add_avg_difficulty_trigger.sql

-- booksテーブルにavg_difficultyカラムを追加（既に存在しない場合）
ALTER TABLE books ADD COLUMN IF NOT EXISTS avg_difficulty NUMERIC(3,1) DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_books_avg_difficulty ON books (avg_difficulty);

-- 書籍の平均難易度を更新する関数
CREATE OR REPLACE FUNCTION update_book_avg_difficulty()
RETURNS TRIGGER AS $$
DECLARE
    avg_diff NUMERIC;
BEGIN
    -- 関連する書籍の全レビューから平均難易度を計算
    SELECT COALESCE(AVG(difficulty), 0)
    INTO avg_diff
    FROM reviews
    WHERE book_id = COALESCE(NEW.book_id, OLD.book_id);

    -- 書籍の平均難易度を更新
    UPDATE books
    SET avg_difficulty = avg_diff,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.book_id, OLD.book_id);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- レビュー追加時のトリガー
DROP TRIGGER IF EXISTS update_book_avg_difficulty_on_insert ON reviews;
CREATE TRIGGER update_book_avg_difficulty_on_insert
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_book_avg_difficulty();

-- レビュー更新時のトリガー
DROP TRIGGER IF EXISTS update_book_avg_difficulty_on_update ON reviews;
CREATE TRIGGER update_book_avg_difficulty_on_update
AFTER UPDATE OF difficulty ON reviews
FOR EACH ROW
WHEN (OLD.difficulty IS DISTINCT FROM NEW.difficulty)
EXECUTE FUNCTION update_book_avg_difficulty();

-- レビュー削除時のトリガー
DROP TRIGGER IF EXISTS update_book_avg_difficulty_on_delete ON reviews;
CREATE TRIGGER update_book_avg_difficulty_on_delete
AFTER DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_book_avg_difficulty();

-- 既存の書籍に対して平均難易度を更新
UPDATE books b
SET avg_difficulty = COALESCE(
    (SELECT AVG(difficulty) FROM reviews r WHERE r.book_id = b.id),
    0
);