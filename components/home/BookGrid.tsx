'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import BookCard from '@/components/home/BookCard';
import { Skeleton } from '@/components/ui/skeleton';
import { searchBooksWithSuggestions } from '@/lib/api/books';
import { getAllBooksFromDB } from '@/lib/supabase/books';
import { useFilterStore } from '@/store/filterStore';
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

  // フィルターストアから状態を取得
  const { difficulty, language, category } = useFilterStore();
  const hasActiveFilters = difficulty.length > 0 || language.length > 0 || category.length > 0;

  // 検索結果か全書籍のどちらを表示するか決定
  const isSearchActive = searchTerm.length >= 2;
  const displayedBooks = isSearchActive ? searchResults : allBooks;
  const isDisplayLoading = isSearchActive ? searchLoading : loading;

  // フィルター適用後の書籍
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);

  // フィルターを適用した結果と「もっと見る」が可能かどうかを計算
  const finalBooks = hasActiveFilters ? filteredBooks : displayedBooks;
  const hasMore = isSearchActive
    ? hasMoreSearch && !hasActiveFilters
    : hasMoreAllBooks && !hasActiveFilters;

  // Intersection Observerの参照
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ローディング参照の設定
  const loadMoreRef = useCallback(
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

  // 全書籍を取得
  useEffect(() => {
    const fetchAllBooks = async () => {
      setLoading(true);
      try {
        const fetchedBooks = await getAllBooksFromDB();
        setAllBooks(fetchedBooks);
        setHasMoreAllBooks(false); // 現在の実装では全書籍を一度に取得
        setLoading(false);
      } catch (error) {
        console.error('書籍の取得中にエラーが発生しました:', error);
        setLoading(false);
      }
    };

    if (!isSearchActive) {
      fetchAllBooks();
    }
  }, [isSearchActive]);

  // 検索語が変更されたときに検索を実行
  useEffect(() => {
    const performSearch = async () => {
      // 検索語が2文字未満の場合は検索しない
      if (!searchTerm || searchTerm.length < 2) {
        return;
      }

      setSearchLoading(true);
      try {
        const { books, hasMore, totalItems } = await searchBooksWithSuggestions(
          searchTerm,
          0,
          PAGE_SIZE
        );
        setSearchResults(books, true); // 検索結果を置き換え
        setHasMore(hasMore);
        setTotalItems(totalItems);
      } catch (error) {
        console.error('検索中にエラーが発生しました:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    performSearch();
  }, [searchTerm, setSearchLoading, setSearchResults, setHasMore, setTotalItems]);

  // フィルターが変更されたときに書籍をフィルタリング
  useEffect(() => {
    if (!hasActiveFilters) {
      setFilteredBooks([]);
      return;
    }

    const applyFilters = () => {
      let filtered = [...displayedBooks];

      console.log('フィルタリング前の書籍数:', filtered.length);
      console.log('アクティブなフィルター:', { difficulty, language, category });

      // 言語判定のヘルパー関数
      const detectLanguageInText = (text: string, langNames: string[]): boolean => {
        if (!text) return false;
        const lowerText = text.toLowerCase();

        // 言語名と一致するか、言語名+空白や句読点などで区切られているかをチェック
        return langNames.some(lang => {
          const lowerLang = lang.toLowerCase();
          // 完全一致または単語境界でのマッチをチェック
          return (
            lowerText.includes(lowerLang) &&
            // 単語の境界をチェック（前後に文字がない、または特定の区切り文字がある）
            (lowerText === lowerLang ||
              lowerText.includes(` ${lowerLang} `) ||
              lowerText.includes(`.${lowerLang} `) ||
              lowerText.includes(` ${lowerLang}.`) ||
              lowerText.includes(`「${lowerLang}」`) ||
              lowerText.includes(`『${lowerLang}』`) ||
              lowerText.includes(`(${lowerLang})`) ||
              lowerText.includes(`（${lowerLang}）`) ||
              lowerText.includes(`${lowerLang}:`) ||
              lowerText.includes(`${lowerLang}：`) ||
              lowerText.includes(`${lowerLang}/`) ||
              lowerText.includes(`/${lowerLang}`) ||
              lowerText.includes(`${lowerLang}、`) ||
              lowerText.includes(`、${lowerLang}`) ||
              lowerText.startsWith(`${lowerLang} `) ||
              lowerText.endsWith(` ${lowerLang}`))
          );
        });
      };

      // 書籍が特定の言語に関連しているかを判定
      const hasLanguage = (book: Book, langNames: string[]): boolean => {
        // DB上のprogrammingLanguagesフィールドを確認
        if (book.programmingLanguages && book.programmingLanguages.length > 0) {
          if (
            book.programmingLanguages.some(lang =>
              langNames.some(l => lang.toLowerCase() === l.toLowerCase())
            )
          ) {
            console.log(`${book.title}: programmingLanguagesでマッチ`, book.programmingLanguages);
            return true;
          }
        }

        // DB上のframeworksフィールドを確認
        if (book.frameworks && book.frameworks.length > 0) {
          if (
            book.frameworks.some(framework =>
              langNames.some(l => framework.toLowerCase().includes(l.toLowerCase()))
            )
          ) {
            console.log(`${book.title}: frameworksでマッチ`, book.frameworks);
            return true;
          }
        }

        // タイトルに言語名が含まれているか確認
        if (detectLanguageInText(book.title, langNames)) {
          console.log(`${book.title}: タイトルでマッチ`);
          return true;
        }

        // カテゴリに言語名が含まれているか確認
        if (
          book.categories &&
          book.categories.length > 0 &&
          book.categories.some(cat =>
            langNames.some(l => cat.toLowerCase().includes(l.toLowerCase()))
          )
        ) {
          console.log(`${book.title}: カテゴリでマッチ`, book.categories);
          return true;
        }

        // 説明文に言語名が含まれているか確認
        if (book.description && detectLanguageInText(book.description, langNames)) {
          console.log(`${book.title}: 説明文でマッチ`);
          return true;
        }

        // いずれにも該当しない場合はfalse
        return false;
      };

      // 各書籍のプログラミング言語とフレームワークの情報をログ
      console.log('書籍データのプログラミング言語情報:');
      filtered.forEach(book => {
        console.log(`書籍: ${book.title}`, {
          language: book.language,
          programmingLanguages: book.programmingLanguages || [],
          frameworks: book.frameworks || [],
          categories: book.categories,
        });
      });

      // 難易度でフィルタリング
      if (difficulty.length > 0) {
        filtered = filtered.filter(book => {
          const bookDifficultyLevel = Math.round(book.avg_difficulty);
          return difficulty.includes(bookDifficultyLevel.toString());
        });
        console.log('難易度フィルター後の書籍数:', filtered.length);
      }

      // 言語でフィルタリング
      if (language.length > 0) {
        console.log('言語フィルター適用前:', language);
        filtered = filtered.filter(book => {
          // 選択された言語（大文字小文字を区別しないように配列を準備）
          const searchLanguages = language.map(l => l.toLowerCase());

          // 改善された判定ロジックを使用
          const matches = hasLanguage(book, searchLanguages);
          console.log(`${book.title} - 言語マッチ:`, matches, {
            searchFor: searchLanguages,
            bookLanguages: book.programmingLanguages || [],
            categories: book.categories,
          });
          return matches;
        });
        console.log('言語フィルター後の書籍数:', filtered.length);
      }

      // カテゴリでフィルタリング
      if (category.length > 0) {
        filtered = filtered.filter(book => book.categories.some(cat => category.includes(cat)));
        console.log('カテゴリフィルター後の書籍数:', filtered.length);
      }

      setFilteredBooks(filtered);
    };

    applyFilters();
  }, [displayedBooks, difficulty, language, category, hasActiveFilters]);

  // 追加の書籍を読み込む関数
  const loadMoreBooks = async () => {
    if (isLoadingMore || !hasMore || hasActiveFilters) return;

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
  if (isDisplayLoading && !finalBooks.length) {
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
  if (isSearchActive && !finalBooks.length) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">「{searchTerm}」に一致する書籍が見つかりませんでした。</p>
      </div>
    );
  }

  // フィルター適用後に書籍が見つからない場合
  if (hasActiveFilters && !finalBooks.length) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">
          選択したフィルター条件に一致する書籍が見つかりませんでした。
        </p>
      </div>
    );
  }

  // 書籍がない場合のメッセージ
  if (!finalBooks.length) {
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
            「{searchTerm}」の検索結果: {finalBooks.length}件
          </p>
        </div>
      )}

      {hasActiveFilters && (
        <div className="mb-4">
          <p className="text-muted-foreground">フィルター適用結果: {finalBooks.length}件</p>
        </div>
      )}

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {finalBooks.map(book => (
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
      {!hasMore && finalBooks.length > 10 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          すべての{isSearchActive ? '検索結果' : '書籍'}を表示しました
        </p>
      )}
    </>
  );
}
