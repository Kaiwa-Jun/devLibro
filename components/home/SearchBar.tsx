'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { mockBooks } from '@/lib/mock-data';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const containerRef = useRef<HTMLDivElement>(null);

  // 検索候補のモックデータ
  const suggestions = mockBooks
    .filter(
      book =>
        book.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )
    .slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm === '') {
      setShowSuggestions(false);
      setNoResults(false);
      return;
    }

    if (debouncedSearchTerm === '000') {
      setShowSuggestions(true);
      setNoResults(true);
      return;
    }

    setShowSuggestions(true);
    setNoResults(false);
  }, [debouncedSearchTerm]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    // Navigate to search results page
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
          onFocus={() => {
            if (searchTerm) setShowSuggestions(true);
          }}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setSearchTerm('');
              setShowSuggestions(false);
              setNoResults(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg overflow-hidden"
          >
            {noResults ? (
              <div className="p-4 space-y-4">
                <p className="text-center text-muted-foreground">
                  お探しの書籍が見つかりませんでした。
                  <br />
                  バーコードをスキャンして検索することもできます。
                </p>
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      // ここにバーコードスキャン機能を実装
                    }}
                  >
                    <Camera className="h-4 w-4" />
                    バーコードで検索
                  </Button>
                </div>
              </div>
            ) : (
              suggestions.map(book => (
                <Link
                  key={book.id}
                  href={`/book/${book.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                  onClick={() => setShowSuggestions(false)}
                >
                  <div className="relative h-12 w-9 flex-shrink-0">
                    <Image
                      src={book.img_url}
                      alt={book.title}
                      fill
                      className="object-cover rounded"
                      sizes="36px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{book.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                  </div>
                </Link>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
