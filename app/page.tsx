import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import BookGrid from '@/components/home/BookGrid';
import FilterButtons from '@/components/home/FilterButtons';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: 'DevLibro - 技術書書評アプリ',
  description:
    '開発者のための技術書レビュー・管理プラットフォーム。技術書の管理、レビュー、共有が簡単に行えます。',
  path: '/',
});

export default function Home() {
  // ルートパスへのアクセスを書籍検索画面にリダイレクト
  redirect('/books');

  // 以下は元のホーム画面のコード（リダイレクトされるため実行されません）
  return (
    <div className="space-y-6 pb-8 pt-8">
      <FilterButtons />
      <BookGrid />
    </div>
  );
}
