'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/useDebounce';
import { searchBooksByTitle as searchGoogleBooks } from '@/lib/api/google-books';
import { searchBooksByTitleInDB } from '@/lib/supabase/books';
import { getUser } from '@/lib/supabase/client';
import { addBookToUserShelf, getUserBooks } from '@/lib/supabase/user-books';
import { Book, UserBook } from '@/types';

type BookStatus = 'unread' | 'reading' | 'done';

interface AddBookModalProps {
  onClose?: () => void;
}

export default function AddBookModal({ onClose }: AddBookModalProps) {
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

  // 検索キーワードが変更されたら自動的に検索を実行
  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

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

  const handleSearch = async () => {
    if (!debouncedSearchTerm) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      // データベースとGoogle Books APIの両方から検索
      const [dbResults, googleResults] = await Promise.all([
        searchBooksByTitleInDB(debouncedSearchTerm),
        searchGoogleBooks(debouncedSearchTerm),
      ]);

      // 重複を削除するためにID（またはISBN）ベースで結合
      const combinedResults = [...dbResults];

      // データベースに存在しない書籍のみをGoogle Books結果から追加
      googleResults.forEach(googleBook => {
        // まずISBNで重複チェック
        if (googleBook.isbn) {
          const existsInDB = dbResults.some(dbBook => dbBook.isbn === googleBook.isbn);
          if (!existsInDB) {
            combinedResults.push(googleBook);
            return;
          }
        }

        // 次にタイトルで重複チェック
        const existsInDB = dbResults.some(
          dbBook => dbBook.title.toLowerCase() === googleBook.title.toLowerCase()
        );

        if (!existsInDB) {
          combinedResults.push(googleBook);
        }
      });

      // ユーザーの本棚に既に存在する書籍を除外
      const filteredResults = combinedResults.filter(book => !isBookInUserLibrary(book));

      setSearchResults(filteredResults);

      if (filteredResults.length === 0 && combinedResults.length > 0) {
        toast.info('検索結果はありますが、すべての書籍が既にあなたの本棚に追加されています');
      }
    } catch (error) {
      console.error('書籍検索エラー:', error);
      toast.error('検索中にエラーが発生しました');
    } finally {
      setIsSearching(false);
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
        toast.success('蔵書に追加しました');
        console.log('書籍追加成功:', result);

        // モーダルを閉じる
        if (onClose) {
          onClose();
        } else if (dialogCloseRef) {
          dialogCloseRef.click();
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
    // バーコードスキャン機能のモック
    toast.info('カメラが起動します');

    // 実際の実装ではここでカメラAPIを使う
    setTimeout(() => {
      const mockScannedBook = {
        id: 'book3',
        title: 'React ハンズオン ラーニング',
        author: 'Alex Banks, Eve Porcello',
        img_url:
          'https://images.pexels.com/photos/256514/pexels-photo-256514.jpeg?auto=compress&cs=tinysrgb&w=800',
        publisher: "O'Reilly Media",
        isbn: '9784873119380',
        language: 'ja',
        categories: ['Programming', 'Web Development'],
        avg_difficulty: 0,
        programmingLanguages: [],
        frameworks: [],
      };

      // 本棚にすでに存在するかチェック
      if (isBookInUserLibrary(mockScannedBook)) {
        toast.error('この書籍は既にあなたの本棚に存在します');
        return;
      }

      setSelectedBook(mockScannedBook);
      toast.success('書籍情報を取得しました');
    }, 2000);
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
            <div className="max-h-60 overflow-y-auto space-y-2">
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
                      {book.isbn && !book.isbn.startsWith('N-') ? (
                        <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">ISBN情報なし</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="mx-auto relative h-48 w-36">
                    <Image
                      src={selectedBook.img_url || '/images/book-placeholder.png'}
                      alt={selectedBook.title}
                      fill
                      className="object-cover rounded-md shadow-md"
                      sizes="(max-width: 768px) 144px, 192px"
                    />
                  </div>
                  <div className="text-center">
                    <h4 className="font-medium text-lg">{selectedBook.title}</h4>
                    <p className="text-sm text-muted-foreground">{selectedBook.author}</p>
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
              <Button variant="outline" className="flex-1" onClick={() => setSelectedBook(null)}>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
