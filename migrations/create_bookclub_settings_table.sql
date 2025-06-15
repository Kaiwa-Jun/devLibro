-- bookclub_settingsテーブルの作成
CREATE TABLE IF NOT EXISTS public.bookclub_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bookclub_id UUID NOT NULL REFERENCES public.bookclubs(id) ON DELETE CASCADE,
    max_participants INTEGER DEFAULT 10,
    is_public BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    settings_json JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(bookclub_id)
);

-- RLSを有効化
ALTER TABLE public.bookclub_settings ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 読み取り権限（公開設定の読書会は誰でも、非公開は参加者のみ）
CREATE POLICY "Enable read access for public bookclubs" ON public.bookclub_settings
FOR SELECT USING (
    is_public = true
    OR EXISTS (
        SELECT 1 FROM public.bookclub_members
        WHERE bookclub_members.bookclub_id = bookclub_settings.bookclub_id
        AND bookclub_members.user_id = auth.uid()
    )
);

-- RLSポリシー: 挿入権限（読書会の作成者のみ）
CREATE POLICY "Enable insert for bookclub creator" ON public.bookclub_settings
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.bookclubs
        WHERE bookclubs.id = bookclub_settings.bookclub_id
        AND bookclubs.created_by = auth.uid()
    )
);

-- RLSポリシー: 更新権限（読書会の作成者のみ）
CREATE POLICY "Enable update for bookclub creator" ON public.bookclub_settings
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.bookclubs
        WHERE bookclubs.id = bookclub_settings.bookclub_id
        AND bookclubs.created_by = auth.uid()
    )
);

-- RLSポリシー: 削除権限（読書会の作成者のみ）
CREATE POLICY "Enable delete for bookclub creator" ON public.bookclub_settings
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.bookclubs
        WHERE bookclubs.id = bookclub_settings.bookclub_id
        AND bookclubs.created_by = auth.uid()
    )
);

-- インデックスの作成
CREATE INDEX idx_bookclub_settings_bookclub_id ON public.bookclub_settings(bookclub_id);
CREATE INDEX idx_bookclub_settings_is_public ON public.bookclub_settings(is_public);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookclub_settings_updated_at BEFORE UPDATE ON public.bookclub_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
