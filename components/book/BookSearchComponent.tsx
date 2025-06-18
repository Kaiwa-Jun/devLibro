'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { searchRakutenBooksWithPagination } from '@/lib/api/rakuten-books';
import { searchBooksByTitleInDB } from '@/lib/supabase/books';
import { Book } from '@/types';

interface BookSearchComponentProps {
  onBookSelect: (book: Book) => void;
  placeholder?: string;
  excludeBooks?: Book[];
  className?: string;
}

export function BookSearchComponent({
  onBookSelect,
  placeholder = '書籍タイトルを検索',
  excludeBooks = [],
  className = '',
}: BookSearchComponentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);

  // 無限スクロール用の状態
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // 書籍が除外リストに含まれているかチェック
  const isBookExcluded = useCallback(
    (book: Book): boolean => {
      return excludeBooks.some(excludedBook => {
        // ISBNがある場合はISBNでマッチング
        if (book.isbn && excludedBook.isbn) {
          return book.isbn === excludedBook.isbn;
        }
        // ISBNがない場合はタイトルと著者でマッチング
        return (
          book.title.toLowerCase() === excludedBook.title.toLowerCase() &&
          book.author.toLowerCase() === excludedBook.author.toLowerCase()
        );
      });
    },
    [excludeBooks]
  );

  // 書籍検索処理
  const handleSearch = useCallback(
    async (searchPage: number = 1, resetResults: boolean = true) => {
      if (!debouncedSearchTerm) return;

      if (resetResults) {
        setIsSearching(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        console.log(`📚 [書籍検索] 開始: "${debouncedSearchTerm}" (ページ: ${searchPage})`);

        // 楽天ブックスAPIで検索
        const rakutenResults = await searchRakutenBooksWithPagination(
          debouncedSearchTerm,
          searchPage,
          20
        );
        console.log(`📚 [楽天ブックス] 検索結果: ${rakutenResults.books.length}件`);

        // DBから検索
        const dbResults = await searchBooksByTitleInDB(debouncedSearchTerm, 20);
        console.log(`📚 [DB] 検索結果: ${dbResults.length}件`);

        // 結果を結合（重複除去）
        const combinedResults: Book[] = [...dbResults];

        // 楽天の結果をDBの結果と重複チェックして追加
        rakutenResults.books.forEach(rakutenBook => {
          // まずISBNで重複チェック
          if (rakutenBook.isbn) {
            const existsInDB = dbResults.some(dbBook => dbBook.isbn === rakutenBook.isbn);
            if (!existsInDB) {
              combinedResults.push(rakutenBook);
              return;
            }
          }

          // 次にタイトルで重複チェック
          const existsInDB = dbResults.some(
            dbBook => dbBook.title.toLowerCase() === rakutenBook.title.toLowerCase()
          );

          if (!existsInDB) {
            combinedResults.push(rakutenBook);
          }
        });

        // 除外リストに含まれる書籍を除外
        const filteredResults = combinedResults.filter(book => !isBookExcluded(book));

        console.log(`📚 [書籍検索] フィルター後: ${filteredResults.length}件`);

        // 次のページがあるかどうかを判定
        setHasMore(rakutenResults.hasMore);

        if (resetResults) {
          setSearchResults(filteredResults);
        } else {
          // 既存の結果と重複を取り除いて結合
          setSearchResults(prev => {
            const existingIds = new Set(prev.map(book => book.id));
            const newResults = filteredResults.filter(book => !existingIds.has(book.id));
            return [...prev, ...newResults];
          });
        }
      } catch (error) {
        console.error('書籍検索エラー:', error);
      } finally {
        if (resetResults) {
          setIsSearching(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    },
    [debouncedSearchTerm, isBookExcluded]
  );

  // 追加結果をロード
  const loadMoreResults = useCallback(async () => {
    if (isLoadingMore || !hasMore || !debouncedSearchTerm) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);
    await handleSearch(nextPage, false);
    setPage(nextPage);
  }, [isLoadingMore, hasMore, debouncedSearchTerm, page, handleSearch]);

  // 検索語が変更されたときにリセットして再検索
  useEffect(() => {
    if (debouncedSearchTerm) {
      // 検索語が変わったら検索結果をリセット
      setSearchResults([]);
      setPage(1);
      setHasMore(true);
      handleSearch(1, true);
    } else {
      setSearchResults([]);
      setHasMore(false);
    }
  }, [debouncedSearchTerm, handleSearch]);

  // Intersection Observerを設定
  useEffect(() => {
    if (!hasMore || isSearching || isLoadingMore || !loadingRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && debouncedSearchTerm) {
          loadMoreResults();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadingRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isSearching, isLoadingMore, debouncedSearchTerm, loadMoreResults]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 検索フィールド */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          className="pl-10 pr-4"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 検索中のローディング */}
      {isSearching && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* 検索結果 */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <h3 className="text-sm font-medium">検索結果</h3>
            <div className="max-h-80 overflow-y-auto space-y-2" ref={resultsContainerRef}>
              {searchResults.map(book => (
                <Card
                  key={book.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onBookSelect(book)}
                >
                  <CardContent className="p-3 flex gap-3">
                    <div className="relative h-16 w-12 flex-shrink-0">
                      <Image
                        src={book.img_url || '/images/book-placeholder.png'}
                        alt={book.title}
                        fill
                        className="object-cover rounded-sm"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-1">{book.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
                      {book.publisherName && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {book.publisherName}
                        </p>
                      )}
                      {book.isbn && !book.isbn.startsWith('N-') ? (
                        <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">ISBN情報なし</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 hover:border-emerald-600 rounded-xl px-4 py-2 font-medium"
                    >
                      選択 ✨
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* 次のページロード用の検出エリア */}
              {(hasMore || isLoadingMore) && (
                <div ref={loadingRef} className="py-2 flex justify-center">
                  {isLoadingMore ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="h-5 w-5" />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 検索結果なしの表示 */}
        {searchResults.length === 0 && debouncedSearchTerm && !isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-8 text-center"
          >
            <div className="text-4xl mb-2">😅</div>
            <p className="text-lg">検索結果が見つかりませんでした</p>
            <p className="text-sm text-muted-foreground">別のキーワードで試してみてください</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
