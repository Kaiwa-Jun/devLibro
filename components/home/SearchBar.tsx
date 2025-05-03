'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { searchBooksWithSuggestions } from '@/lib/api/books';
import { saveBookToDB } from '@/lib/supabase/books';
import { Book } from '@/types';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 検索語がある場合はAPIを呼び出す
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchBooksWithSuggestions(debouncedSearchTerm);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchTerm]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
          onFocus={() => {
            if (searchTerm && searchTerm.length >= 2) setShowSuggestions(true);
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
              setSuggestions([]);
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
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                <p className="mt-2 text-sm text-muted-foreground">検索中...</p>
              </div>
            ) : suggestions.length === 0 ? (
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
                      // バーコードスキャン機能への遷移
                      router.push('/scan');
                    }}
                  >
                    <Camera className="h-4 w-4" />
                    バーコードで検索
                  </Button>
                </div>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-auto">
                {suggestions.map(book => (
                  <Link
                    key={book.id}
                    href={`/book/${book.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                    onClick={async e => {
                      e.preventDefault(); // デフォルトのリンク遷移を防止
                      setShowSuggestions(false);
                      setIsLoading(true); // 処理中はローディング表示

                      try {
                        console.log('選択された書籍:', book);

                        // セッションストレージに書籍データを保存（フォールバック用）
                        try {
                          sessionStorage.setItem(`book_${book.id}`, JSON.stringify(book));
                          console.log('書籍情報をセッションストレージに保存しました');
                        } catch (storageError) {
                          console.error('セッションストレージへの保存に失敗:', storageError);
                        }

                        // 選択された書籍をDBに確実に保存
                        const savedBook = await saveBookToDB(book);

                        if (savedBook) {
                          console.log('保存された書籍:', savedBook);

                          // 保存に成功した場合、改めてセッションストレージにも最新データを保存
                          try {
                            sessionStorage.setItem(
                              `book_${savedBook.id}`,
                              JSON.stringify(savedBook)
                            );
                          } catch (storageError) {
                            console.error(
                              '更新されたデータのセッションストレージへの保存に失敗:',
                              storageError
                            );
                          }

                          // 保存に成功したらSupabaseに割り当てられたIDで遷移
                          router.push(`/book/${savedBook.id}`);
                          setIsLoading(false);
                        } else {
                          console.error(
                            '書籍の保存に失敗しました。セッションストレージのデータを使用します。'
                          );
                          // 失敗しても元のIDで遷移
                          router.push(`/book/${book.id}`);
                          setIsLoading(false);
                        }
                      } catch (error) {
                        console.error('検索結果クリック時エラー:', error);
                        // エラーが発生しても遷移を試みる
                        router.push(`/book/${book.id}`);
                        setIsLoading(false);
                      }
                    }}
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
                ))}
                {suggestions.length > 0 && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={handleSearch}
                    >
                      「{searchTerm}」の検索結果をすべて表示
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
