'use client';

import { ArrowLeft, Book as BookIcon, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import BookCard from '@/components/home/BookCard';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { debugMode } from '@/lib/analytics/gtag';
import { searchBooksByTitle } from '@/lib/api/books';
import { Book } from '@/types';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { trackSearch } = useAnalytics();

  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreBooks();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoadingMore, hasMore]
  );

  // 最初の検索
  useEffect(() => {
    const fetchBooks = async () => {
      if (!query) {
        router.push('/');
        return;
      }

      setIsLoading(true);
      setError(null);
      setPage(0);

      try {
        const results = await searchBooksByTitle({ query });
        setBooks(results.books);
        setTotalItems(results.totalItems);
        setHasMore(results.hasMore);

        // Google Analyticsに検索イベントを送信
        trackSearch(query, results.totalItems);
        if (debugMode()) {
          console.log(
            `[Analytics Debug] Search tracked: "${query}" (${results.totalItems} results)`
          );
        }

        if (results.books.length === 0) {
          setError('検索結果が見つかりませんでした。別のキーワードで試してください。');
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('検索中にエラーが発生しました。再度お試しください。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [query, router, trackSearch]);

  // 追加データの読み込み
  const loadMoreBooks = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;
    const startIndex = nextPage * 20; // 1ページあたり20件表示

    try {
      const results = await searchBooksByTitle({
        query,
        startIndex,
      });

      setBooks(prevBooks => [...prevBooks, ...results.books]);
      setHasMore(results.hasMore);
      setPage(nextPage);

      // 追加読み込みイベントを記録
      if (debugMode()) {
        console.log(`[Analytics Debug] Load more results: page ${nextPage} for "${query}"`);
      }
    } catch (error) {
      console.error('Error loading more books:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold ml-2">「{query}」の検索結果</h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">検索中...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
          <BookIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium mb-2">検索結果が見つかりません</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/')}>トップページに戻る</Button>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground mb-6">
            {totalItems > 0
              ? `${totalItems}件中 ${books.length}件表示`
              : `${books.length}件の検索結果`}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {books.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {/* 無限スクロール用ローダー */}
          {hasMore && (
            <div ref={loaderRef} className="flex justify-center items-center py-8">
              {isLoadingMore ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p className="text-sm text-muted-foreground">読み込み中...</p>
                </div>
              ) : (
                <div className="h-10" />
              )}
            </div>
          )}

          {/* すべての結果を表示した場合 */}
          {books.length > 0 && !hasMore && !isLoadingMore && (
            <p className="text-center text-sm text-muted-foreground py-8">
              すべての検索結果を表示しました
            </p>
          )}
        </>
      )}
    </div>
  );
}
