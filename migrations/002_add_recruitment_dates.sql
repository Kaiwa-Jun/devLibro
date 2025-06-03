-- migrations/002_add_recruitment_dates.sql
-- 輪読会テーブルに募集期間のフィールドを追加

ALTER TABLE reading_circles 
ADD COLUMN recruitment_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN recruitment_end_date TIMESTAMP WITH TIME ZONE;

-- 既存データの移行
-- recruitment_start_date は created_at に設定
-- recruitment_end_date は start_date の1日前に設定（start_dateが存在する場合）
UPDATE reading_circles 
SET recruitment_start_date = created_at,
    recruitment_end_date = CASE 
        WHEN start_date IS NOT NULL THEN start_date::timestamp - INTERVAL '1 day'
        ELSE created_at + INTERVAL '7 days'
    END
WHERE recruitment_start_date IS NULL;

-- インデックスを追加（ステータス判定のパフォーマンス向上のため）
CREATE INDEX idx_reading_circles_recruitment_dates ON reading_circles (recruitment_start_date, recruitment_end_date);
CREATE INDEX idx_reading_circles_circle_dates ON reading_circles (start_date, end_date);

-- コメント追加
COMMENT ON COLUMN reading_circles.recruitment_start_date IS '募集開始日時';
COMMENT ON COLUMN reading_circles.recruitment_end_date IS '募集終了日時'; 
