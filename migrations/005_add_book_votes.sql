-- migrations/005_add_book_votes.sql

-- 書籍候補への投票を記録するテーブル
CREATE TABLE IF NOT EXISTS bookclub_book_votes (
    id SERIAL PRIMARY KEY,
    bookclub_id UUID NOT NULL,
    book_id INTEGER NOT NULL,
    user_id UUID NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookclub_book_votes_bookclub 
        FOREIGN KEY (bookclub_id) REFERENCES bookclubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookclub_book_votes_book 
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookclub_book_votes_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- 1人のユーザーが同じ輪読会の同じ書籍に1票のみ
    CONSTRAINT unique_user_bookclub_book_vote UNIQUE (bookclub_id, book_id, user_id)
);

-- インデックス追加
CREATE INDEX idx_bookclub_book_votes_bookclub_id ON bookclub_book_votes (bookclub_id);
CREATE INDEX idx_bookclub_book_votes_book_id ON bookclub_book_votes (book_id);
CREATE INDEX idx_bookclub_book_votes_user_id ON bookclub_book_votes (user_id);
CREATE INDEX idx_bookclub_book_votes_voted_at ON bookclub_book_votes (voted_at);

-- RLSポリシー設定
ALTER TABLE bookclub_book_votes ENABLE ROW LEVEL SECURITY;

-- 投票は読書会メンバーなら閲覧可能
CREATE POLICY "Book votes viewable by bookclub members" 
    ON bookclub_book_votes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookclub_members 
            WHERE bookclub_members.bookclub_id = bookclub_book_votes.bookclub_id 
            AND bookclub_members.user_id = auth.uid()
        )
    );

-- 投票は読書会メンバーのみ可能
CREATE POLICY "Book votes insertable by bookclub members" 
    ON bookclub_book_votes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM bookclub_members 
            WHERE bookclub_members.bookclub_id = bookclub_book_votes.bookclub_id 
            AND bookclub_members.user_id = auth.uid()
        )
    );

-- 自分の投票のみ削除可能
CREATE POLICY "Book votes deletable by voter" 
    ON bookclub_book_votes FOR DELETE
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM bookclub_members 
            WHERE bookclub_members.bookclub_id = bookclub_book_votes.bookclub_id 
            AND bookclub_members.user_id = auth.uid()
        )
    ); 
