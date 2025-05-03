'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import BookCard from '@/components/home/BookCard';
import { Skeleton } from '@/components/ui/skeleton';
import { searchBooksWithSuggestions } from '@/lib/api/books';
import { getAllBooksFromDB } from '@/lib/supabase/books';
import { useSearchStore } from '@/store/searchStore';
import { Book } from '@/types';

// 1ページあたりの書籍数
const PAGE_SIZE = 20;

export default function BookGrid() {
  const [loading, setLoading] = useState(true);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [hasMoreAllBooks, setHasMoreAllBooks] = useState(false);
  const [allBooksPage, setAllBooksPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 検索ストアから状態を取得
  const {
    searchTerm,
    searchResults,
    isLoading: searchLoading,
    hasMore: hasMoreSearch,
    currentPage: searchPage,
    incrementPage,
    setSearchResults,
    setSearchLoading,
    setHasMore,
    setTotalItems,
  } = useSearchStore();

  // 検索結果か全書籍のどちらを表示するか決定
  const isSearchActive = searchTerm.length >= 2;
  const displayedBooks = isSearchActive ? searchResults : allBooks;
  const isDisplayLoading = isSearchActive ? searchLoading : loading;
  const hasMore = isSearchActive ? hasMoreSearch : hasMoreAllBooks;

  // Intersection Observerの参照
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 無限スクロールのトリガーとなる要素の参照
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(entries => {
        // 表示領域に入ったら次のページを読み込む
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreBooks();
        }
      });

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isLoadingMore, hasMore]
  );

  // 初回の全書籍読み込み
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const fetchedBooks = await getAllBooksFromDB();
        setAllBooks(fetchedBooks);
        setLoading(false);

        // 取得した数が上限に達していればまだあると判断
        setHasMoreAllBooks(fetchedBooks.length >= 100);
      } catch (error) {
        console.error('書籍データの取得に失敗しました:', error);
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // 検索キーワードが変わったらAPIで検索を実行
  useEffect(() => {
    // 検索語がある場合のみ
    if (isSearchActive && searchPage === 0) {
      const performSearch = async () => {
        setSearchLoading(true);

        try {
          const { books, hasMore, totalItems } = await searchBooksWithSuggestions(
            searchTerm,
            0,
            PAGE_SIZE
          );

          setSearchResults(books, true); // 結果を置き換え
          setHasMore(hasMore);
          setTotalItems(totalItems);
        } catch (error) {
          console.error('検索中にエラーが発生しました:', error);
        } finally {
          setSearchLoading(false);
        }
      };

      performSearch();
    }
  }, [
    searchTerm,
    isSearchActive,
    searchPage,
    setSearchLoading,
    setSearchResults,
    setHasMore,
    setTotalItems,
  ]);

  // 追加の書籍を読み込む関数
  const loadMoreBooks = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      if (isSearchActive) {
        // 検索モードの場合は次のページを読み込む
        const nextPage = searchPage + 1;
        const startIndex = nextPage * PAGE_SIZE;

        const { books, hasMore } = await searchBooksWithSuggestions(
          searchTerm,
          startIndex,
          PAGE_SIZE
        );

        setSearchResults(books); // 結果に追加
        setHasMore(hasMore);
        incrementPage(); // ページをインクリメント
      } else {
        // 全書籍表示モードの場合
        // Note: 通常はページネーションAPIを使いますが、現在は上限まで取得済みなのでここは省略
        console.log('全書籍の追加読み込みは未実装です');
        setHasMoreAllBooks(false);
      }
    } catch (error) {
      console.error('追加データ読み込み中にエラーが発生しました:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // ローディング表示
  if (isDisplayLoading && !displayedBooks.length) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[180px] w-full rounded-md" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  // 検索結果が空の場合のメッセージ
  if (isSearchActive && displayedBooks.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">「{searchTerm}」に一致する書籍が見つかりませんでした。</p>
      </div>
    );
  }

  // 書籍がない場合のメッセージ
  if (displayedBooks.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">書籍が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <>
      {isSearchActive && (
        <div className="mb-4">
          <p className="text-muted-foreground">
            「{searchTerm}」の検索結果: {displayedBooks.length}件
          </p>
        </div>
      )}

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {displayedBooks.map(book => (
          <motion.div key={book.id} variants={item}>
            <BookCard book={book} />
          </motion.div>
        ))}
      </motion.div>

      {/* 無限スクロール用ローダー */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center my-8">
          {isLoadingMore ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-sm text-muted-foreground">読み込み中...</p>
            </div>
          ) : (
            <div className="h-10" /> /* ローダーと同じ高さの空白 */
          )}
        </div>
      )}

      {/* すべて表示したことを示すメッセージ */}
      {!hasMore && displayedBooks.length > 10 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          すべての{isSearchActive ? '検索結果' : '書籍'}を表示しました
        </p>
      )}
    </>
  );
}
