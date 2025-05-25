'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import CongratulationsModal from '@/components/modals/CongratulationsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/useDebounce';
import { searchRakutenBooksWithPagination } from '@/lib/api/rakuten-books';
import { searchBooksByTitleInDB } from '@/lib/supabase/books';
import { getUser } from '@/lib/supabase/client';
import { addBookToUserShelf, getUserBooks } from '@/lib/supabase/user-books';
import { Book, UserBook } from '@/types';

type BookStatus = 'unread' | 'reading' | 'done';

interface AddBookModalProps {
  onClose?: () => void;
  onBookAdded?: (status: BookStatus) => void;
}

export default function AddBookModal({ onClose, onBookAdded }: AddBookModalProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BookStatus>('unread');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [dialogCloseRef, setDialogCloseRef] = useState<HTMLButtonElement | null>(null);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [isLoadingUserBooks, setIsLoadingUserBooks] = useState(false);
  const [isCongratulationsModalOpen, setIsCongratulationsModalOpen] = useState(false);

  // 無限スクロール用の状態
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // コンポーネントマウント時にユーザーIDを取得
  useEffect(() => {
    async function fetchUserId() {
      try {
        const { user } = await getUser();
        if (user) {
          setUserId(user.id);
          console.log('ユーザーID取得成功:', user.id);
          // ユーザーIDが取得できたら、そのユーザーの書籍リストも取得
          fetchUserBooks(user.id);
        } else {
          console.error('ユーザーが見つかりません');
        }
      } catch (error) {
        console.error('ユーザー情報取得エラー:', error);
      }
    }

    fetchUserId();
  }, []);

  // ユーザーの書籍リストを取得
  const fetchUserBooks = async (userId: string) => {
    setIsLoadingUserBooks(true);
    try {
      const books = await getUserBooks(userId);
      setUserBooks(books);
      console.log(`ユーザーの書籍リスト取得成功: ${books.length}冊`);
    } catch (error) {
      console.error('ユーザーの書籍リスト取得エラー:', error);
    } finally {
      setIsLoadingUserBooks(false);
    }
  };

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
  }, [debouncedSearchTerm]);

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
  }, [hasMore, isSearching, isLoadingMore, debouncedSearchTerm, loadingRef.current]);

  // 書籍がユーザーの本棚に既に存在するかチェック
  const isBookInUserLibrary = (book: Book): boolean => {
    return userBooks.some(userBook => {
      // ISBNがある場合はISBNでマッチング
      if (book.isbn && userBook.book.isbn) {
        return book.isbn === userBook.book.isbn;
      }
      // ISBNがない場合はタイトルと著者でマッチング
      return (
        book.title.toLowerCase() === userBook.book.title.toLowerCase() &&
        book.author.toLowerCase() === userBook.book.author.toLowerCase()
      );
    });
  };

  // 追加結果をロード
  const loadMoreResults = async () => {
    if (isLoadingMore || !hasMore || !debouncedSearchTerm) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);
    await handleSearch(nextPage, false);
    setPage(nextPage);
  };

  // 検索関数（ページ番号と結果リセットフラグを引数に追加）
  const handleSearch = async (currentPage = 1, resetResults = false) => {
    if (!debouncedSearchTerm) return;

    if (resetResults) {
      setIsSearching(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      console.log(`📚 [楽天検索] "${debouncedSearchTerm}" を検索中... (ページ: ${currentPage})`);

      // データベースと楽天Books APIの両方から検索
      const [dbResults, rakutenResults] = await Promise.all([
        searchBooksByTitleInDB(debouncedSearchTerm, 10),
        searchRakutenBooksWithPagination(debouncedSearchTerm, currentPage, 20),
      ]);

      console.log(
        `📚 [楽天検索] 結果: DBから${dbResults.length}件、楽天から${rakutenResults.books.length}件`
      );

      // 重複を削除するためにISBNベースで結合
      const combinedResults = [...dbResults];

      // データベースに存在しない書籍のみを楽天結果から追加
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

      // ユーザーの本棚に既に存在する書籍を除外
      const filteredResults = combinedResults.filter(book => !isBookInUserLibrary(book));

      console.log(`📚 [楽天検索] フィルター後: ${filteredResults.length}件`);

      // 次のページがあるかどうかを判定
      setHasMore(rakutenResults.hasMore);

      if (resetResults) {
        setSearchResults(filteredResults);
      } else {
        // 既存の結果と重複を取り除いて結合
        const existingIds = new Set(searchResults.map(book => book.id));
        const newResults = filteredResults.filter(book => !existingIds.has(book.id));
        setSearchResults(prev => [...prev, ...newResults]);
      }

      if (filteredResults.length === 0 && combinedResults.length > 0) {
        toast.info('検索結果はありますが、すべての書籍が既にあなたの本棚に追加されています');
      }
    } catch (error) {
      console.error('書籍検索エラー:', error);
      toast.error('検索中にエラーが発生しました');
    } finally {
      if (resetResults) {
        setIsSearching(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    console.log('選択した書籍:', book);
  };

  const handleAddBook = async () => {
    if (!selectedBook || !userId) {
      toast.error('書籍が選択されていないか、ユーザーが認証されていません');
      console.error('Book or UserID missing', { book: selectedBook, userId });
      return;
    }

    // 念のため再確認（UI上では表示されないはずだが）
    if (isBookInUserLibrary(selectedBook)) {
      toast.error('この書籍は既にあなたの本棚に存在します');
      return;
    }

    setIsAdding(true);
    try {
      console.log('書籍追加開始:', { userId, book: selectedBook, status: selectedStatus });
      const result = await addBookToUserShelf(userId, selectedBook, selectedStatus);

      if (result) {
        toast.success('本棚に追加しました');
        console.log('書籍追加成功:', result);

        if (selectedStatus === 'done') {
          setIsCongratulationsModalOpen(true);
        }

        // 親コンポーネントに追加されたステータスを通知
        if (onBookAdded) {
          onBookAdded(selectedStatus);
        }

        // モーダルを閉じる（読了モーダルが表示される場合は後で閉じる）
        if (selectedStatus !== 'done') {
          if (onClose) {
            onClose();
          } else if (dialogCloseRef) {
            dialogCloseRef.click();
          }
        }

        // プロフィールページにリダイレクト
        router.push('/profile');
        router.refresh();
      } else {
        toast.error('書籍の追加に失敗しました');
        console.error('書籍追加失敗: 戻り値がnull');
      }
    } catch (error) {
      console.error('書籍追加エラー:', error);
      // エラーの詳細情報を表示
      if (error instanceof Error) {
        toast.error(`エラー: ${error.message}`);
      } else {
        toast.error('書籍の追加中に不明なエラーが発生しました');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleScanBarcode = () => {
    // モーダルを閉じる
    if (onClose) {
      onClose();
    } else if (dialogCloseRef) {
      dialogCloseRef.click();
    }

    // バーコードスキャン画面に遷移
    router.push('/scan');
  };

  const handleCongratulationsClose = () => {
    setIsCongratulationsModalOpen(false);
    if (onClose) {
      onClose();
    } else if (dialogCloseRef) {
      dialogCloseRef.click();
    }
  };

  return (
    <div className="space-y-6 py-2">
      {/* 非表示の DialogClose ボタン（プログラムからモーダルを閉じるために使用） */}
      <DialogClose ref={setDialogCloseRef} className="hidden" />

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="書籍タイトルを検索"
              className="pl-10 pr-4"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleScanBarcode}
            title="バーコードをスキャン"
            disabled={isLoadingUserBooks}
            className="sm:hidden"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>

        {isSearching && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {searchResults.length > 0 && !selectedBook && (
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
                  onClick={() => handleSelectBook(book)}
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
                    <div>
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

        {searchResults.length === 0 && debouncedSearchTerm && !isSearching && !selectedBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-8 text-center"
          >
            <p className="text-muted-foreground">
              検索結果がありません。別のキーワードで検索してみてください。
            </p>
          </motion.div>
        )}

        {selectedBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-medium">選択した書籍</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 書籍情報カラム */}
              <Card className="h-fit">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative h-32 w-24 flex-shrink-0">
                      <Image
                        src={selectedBook.img_url || '/images/book-placeholder.png'}
                        alt={selectedBook.title}
                        fill
                        className="object-cover rounded-md shadow-md"
                        sizes="96px"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-lg line-clamp-2">{selectedBook.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {selectedBook.author}
                      </p>
                      {selectedBook.publisherName && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {selectedBook.publisherName}
                        </p>
                      )}
                      {selectedBook.isbn && !selectedBook.isbn.startsWith('N-') ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          ISBN: {selectedBook.isbn}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1 italic">ISBN情報なし</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ステータス選択カラム */}
              <div className="space-y-4 flex flex-col justify-center min-h-[200px]">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">ステータス</h3>
                  <Tabs
                    value={selectedStatus}
                    onValueChange={value => setSelectedStatus(value as BookStatus)}
                  >
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="unread">未読</TabsTrigger>
                      <TabsTrigger value="reading">読書中</TabsTrigger>
                      <TabsTrigger value="done">読了</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedBook(null)}
                  >
                    キャンセル
                  </Button>
                  <Button className="flex-1" onClick={handleAddBook} disabled={isAdding}>
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        追加中...
                      </>
                    ) : (
                      '追加する'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 読了おめでとうモーダル */}
      {selectedBook && (
        <CongratulationsModal
          isOpen={isCongratulationsModalOpen}
          onClose={handleCongratulationsClose}
          book={selectedBook}
        />
      )}
    </div>
  );
}
