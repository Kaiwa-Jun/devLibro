import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: 'DevLibro - 書籍検索',
  description: '技術書の検索と閲覧。高解像度の書籍画像でより詳細に確認できます。',
  path: '/books',
});

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
