-- migrations/003_remove_recruitment_dates.sql
-- 募集期間フィールドを削除

-- インデックスを削除
DROP INDEX IF EXISTS idx_reading_circles_recruitment_dates;

-- 募集期間フィールドを削除
ALTER TABLE reading_circles 
DROP COLUMN IF EXISTS recruitment_start_date,
DROP COLUMN IF EXISTS recruitment_end_date; 
