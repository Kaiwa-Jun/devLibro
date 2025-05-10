import { Metadata } from 'next';

import BookGrid from '@/components/home/BookGrid';
import FilterButtons from '@/components/home/FilterButtons';
import SearchBar from '@/components/home/SearchBar';

export const metadata: Metadata = {
  title: 'DevLibro - ホーム',
  description: '技術書を探して、レビューを閲覧・投稿しよう',
};

export default function Home() {
  return (
    <div className="space-y-6 pb-8 pt-8">
      <div className="max-w-2xl mx-auto relative">
        <SearchBar />
      </div>
      <FilterButtons />
      <BookGrid />
    </div>
  );
}
