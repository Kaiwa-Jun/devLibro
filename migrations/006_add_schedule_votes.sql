-- migrations/006_add_schedule_votes.sql

-- スケジュール投票を保存するテーブル
CREATE TABLE IF NOT EXISTS bookclub_schedule_votes (
    id SERIAL PRIMARY KEY,
    bookclub_id UUID NOT NULL,
    schedule_id INTEGER NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedule_votes_bookclub 
        FOREIGN KEY (bookclub_id) REFERENCES bookclubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_votes_schedule 
        FOREIGN KEY (schedule_id) REFERENCES bookclub_schedule_candidates(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_votes_user 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    -- 一人のユーザーが同じスケジュールに複数回投票できないようにする
    UNIQUE(bookclub_id, schedule_id, user_id)
);

-- インデックス追加
CREATE INDEX idx_bookclub_schedule_votes_bookclub_id 
    ON bookclub_schedule_votes (bookclub_id);
CREATE INDEX idx_bookclub_schedule_votes_schedule_id 
    ON bookclub_schedule_votes (schedule_id);
CREATE INDEX idx_bookclub_schedule_votes_user_id 
    ON bookclub_schedule_votes (user_id);

-- RLSポリシー設定
ALTER TABLE bookclub_schedule_votes ENABLE ROW LEVEL SECURITY;

-- スケジュール投票は読書会メンバーなら閲覧可能
CREATE POLICY "Schedule votes viewable by bookclub members" 
    ON bookclub_schedule_votes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookclub_members 
            WHERE bookclub_members.bookclub_id = bookclub_schedule_votes.bookclub_id 
            AND bookclub_members.user_id = auth.uid()
        )
    );

-- スケジュール投票は読書会メンバーが自分の投票を管理
CREATE POLICY "Schedule votes manageable by voters" 
    ON bookclub_schedule_votes FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookclub_members 
            WHERE bookclub_members.bookclub_id = bookclub_schedule_votes.bookclub_id 
            AND bookclub_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Schedule votes deletable by voters" 
    ON bookclub_schedule_votes FOR DELETE
    USING (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookclub_members 
            WHERE bookclub_members.bookclub_id = bookclub_schedule_votes.bookclub_id 
            AND bookclub_members.user_id = auth.uid()
        )
    );

-- 投票数を効率的に取得するためのビュー
CREATE OR REPLACE VIEW bookclub_schedule_vote_counts AS 
SELECT 
    bsv.bookclub_id,
    bsv.schedule_id,
    COUNT(*) as vote_count,
    bsc.day_of_week,
    bsc.start_time,
    bsc.end_time
FROM bookclub_schedule_votes bsv
JOIN bookclub_schedule_candidates bsc ON bsv.schedule_id = bsc.id
GROUP BY bsv.bookclub_id, bsv.schedule_id, bsc.day_of_week, bsc.start_time, bsc.end_time;

-- ビューのRLSポリシー
ALTER VIEW bookclub_schedule_vote_counts SET (security_invoker = true); 
