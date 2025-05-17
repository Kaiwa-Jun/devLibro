import { Metadata } from 'next';

import FilterButtons from '@/components/home/FilterButtons';
import RakutenBookGrid from '@/components/rakuten/BookGrid';
import RakutenSearchBar from '@/components/rakuten/SearchBar';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: 'DevLibro - 書籍検索',
  description: '技術書の検索と閲覧。高解像度の書籍画像でより詳細に確認できます。',
  path: '/books',
});

export default function BooksSearchPage() {
  return (
    <div className="space-y-6 pb-8 pt-8">
      <div className="max-w-2xl mx-auto relative">
        <RakutenSearchBar />
      </div>
      <FilterButtons />
      <RakutenBookGrid />
    </div>
  );
}
