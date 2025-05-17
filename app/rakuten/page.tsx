import { Metadata } from 'next';

import FilterButtons from '@/components/home/FilterButtons';
import RakutenBookGrid from '@/components/rakuten/BookGrid';
import RakutenSearchBar from '@/components/rakuten/SearchBar';
import { generatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generatePageMetadata({
  title: 'DevLibro - 楽天Books検索',
  description: '楽天BooksAPIを使用した技術書検索。高解像度の書籍画像を確認できます。',
  path: '/rakuten',
});

export default function RakutenSearchPage() {
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
