'use client';

import { Camera, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchStore } from '@/store/searchStore';

export default function RakutenSearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 検索ストアから状態と更新関数を取得
  const {
    setSearchTerm: setGlobalSearchTerm,
    resetPagination,
    clearSearch,
    setUseRakuten,
  } = useSearchStore();

  // 楽天APIを使用することを設定
  useEffect(() => {
    setUseRakuten(true);
    return () => {
      setUseRakuten(false);
    };
  }, [setUseRakuten]);

  // 検索語がある場合は検索ストアに設定
  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
      setGlobalSearchTerm('');
      return;
    }

    setIsLocalLoading(true);
    setGlobalSearchTerm(debouncedSearchTerm);
    setIsLocalLoading(false);
  }, [debouncedSearchTerm, setGlobalSearchTerm]);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      // 検索語が空の場合は検索結果をクリア
      clearSearch();
      return;
    }
    // 検索語をセット（実際の検索はBookGridが実行）
    setGlobalSearchTerm(searchTerm.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    clearSearch();
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
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 gap-1 flex md:hidden"
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
