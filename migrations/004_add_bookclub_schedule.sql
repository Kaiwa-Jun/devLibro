-- migrations/004_add_bookclub_schedule.sql

-- 既存のテーブル確認とスケジュール関連のテーブル追加

-- 読書会のスケジュール候補を保存するテーブル
CREATE TABLE IF NOT EXISTS bookclub_schedule_candidates (
    id SERIAL PRIMARY KEY,
    bookclub_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0:日曜日, 6:土曜日
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookclub_schedule_bookclub 
        FOREIGN KEY (bookclub_id) REFERENCES bookclubs(id) ON DELETE CASCADE
);

-- インデックス追加
CREATE INDEX idx_bookclub_schedule_candidates_bookclub_id 
    ON bookclub_schedule_candidates (bookclub_id);
CREATE INDEX idx_bookclub_schedule_candidates_day_time 
    ON bookclub_schedule_candidates (day_of_week, start_time);

-- 読書会の詳細設定を保存するテーブル（将来拡張用）
CREATE TABLE IF NOT EXISTS bookclub_settings (
    id SERIAL PRIMARY KEY,
    bookclub_id UUID NOT NULL UNIQUE,
    max_participants INTEGER DEFAULT 10,
    is_public BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    settings_json JSONB, -- 将来的な設定項目用
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookclub_settings_bookclub 
        FOREIGN KEY (bookclub_id) REFERENCES bookclubs(id) ON DELETE CASCADE
);

-- インデックス追加
CREATE INDEX idx_bookclub_settings_bookclub_id 
    ON bookclub_settings (bookclub_id);

-- RLSポリシー設定
ALTER TABLE bookclub_schedule_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookclub_settings ENABLE ROW LEVEL SECURITY;

-- スケジュール候補は読書会メンバーなら閲覧可能
CREATE POLICY "Schedule candidates viewable by bookclub members" 
    ON bookclub_schedule_candidates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookclub_members 
            WHERE bookclub_members.bookclub_id = bookclub_schedule_candidates.bookclub_id 
            AND bookclub_members.user_id = auth.uid()
        )
    );

-- スケジュール候補は読書会作成者が管理
CREATE POLICY "Schedule candidates manageable by organizer" 
    ON bookclub_schedule_candidates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM bookclubs 
            WHERE bookclubs.id = bookclub_schedule_candidates.bookclub_id 
            AND bookclubs.created_by = auth.uid()
        )
    );

-- 読書会設定は読書会メンバーなら閲覧可能
CREATE POLICY "Bookclub settings viewable by members" 
    ON bookclub_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookclub_members 
            WHERE bookclub_members.bookclub_id = bookclub_settings.bookclub_id 
            AND bookclub_members.user_id = auth.uid()
        )
    );

-- 読書会設定は読書会作成者が管理
CREATE POLICY "Bookclub settings manageable by organizer" 
    ON bookclub_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM bookclubs 
            WHERE bookclubs.id = bookclub_settings.bookclub_id 
            AND bookclubs.created_by = auth.uid()
        )
    );

-- updated_atを自動更新するトリガー
CREATE TRIGGER update_bookclub_settings_updated_at
    BEFORE UPDATE ON bookclub_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();