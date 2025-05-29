'use client';

import { useRef, useState } from 'react';

import FilterButtons from '@/components/home/FilterButtons';
import RakutenBookGrid from '@/components/rakuten/BookGrid';
import RakutenSearchBar from '@/components/rakuten/SearchBar';
import RecommendationSection, {
  RecommendationSectionRef,
} from '@/components/recommendations/RecommendationSection';

export default function BooksSearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const recommendationRef = useRef<RecommendationSectionRef>(null);

  return (
    <div className="space-y-6 pb-8 pt-8">
      <div className="max-w-2xl mx-auto relative">
        <RakutenSearchBar onSearchStateChange={setIsSearching} />
      </div>
      {!isSearching && <RecommendationSection ref={recommendationRef} />}
      <FilterButtons />
      <RakutenBookGrid />
    </div>
  );
}
