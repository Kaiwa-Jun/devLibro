'use client';

import { Camera, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { searchBooksWithSuggestions } from '@/lib/api/books';
import { useSearchStore } from '@/store/searchStore';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 検索ストアから状態と更新関数を取得
  const {
    setSearchTerm: setGlobalSearchTerm,
    setSearchResults,
    setSearchLoading,
  } = useSearchStore();

  // 検索語がある場合はAPIを呼び出す
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        setGlobalSearchTerm('');
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }

      setIsLocalLoading(true);
      setSearchLoading(true);
      setGlobalSearchTerm(debouncedSearchTerm);

      try {
        const results = await searchBooksWithSuggestions(debouncedSearchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setSearchResults([]);
      } finally {
        setIsLocalLoading(false);
        setSearchLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearchTerm, setGlobalSearchTerm, setSearchLoading, setSearchResults]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      // 検索語が空の場合は検索結果をクリア
      setGlobalSearchTerm('');
      setSearchResults([]);
      return;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setGlobalSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="relative max-w-2xl mx-auto" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="書籍タイトルを検索"
          className="pl-10 pr-4 h-11 rounded-full bg-muted"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isLocalLoading && (
        <div className="absolute right-14 top-1/2 transform -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        </div>
      )}

      {!searchTerm && (
        <Button
          variant="outline"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 gap-1"
          onClick={() => {
            router.push('/scan');
          }}
        >
          <Camera className="h-3.5 w-3.5" />
          <span className="text-xs">スキャン</span>
        </Button>
      )}
    </div>
  );
}
