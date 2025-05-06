'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/useDebounce';
import { searchBooksByTitle as searchGoogleBooks } from '@/lib/api/google-books';
import { searchBooksByTitleInDB } from '@/lib/supabase/books';
import { getUser } from '@/lib/supabase/client';
import { addBookToUserShelf } from '@/lib/supabase/user-books';
import { Book } from '@/types';

type BookStatus = 'unread' | 'reading' | 'done';

export default function AddBookModal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BookStatus>('unread');
  const [userId, setUserId] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // コンポーネントマウント時にユーザーIDを取得
  useEffect(() => {
    async function fetchUserId() {
      try {
        const { user } = await getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error('ユーザー情報取得エラー:', error);
      }
    }

    fetchUserId();
  }, []);

  // 検索キーワードが変更されたら自動的に検索を実行
  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

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

      setSearchResults(combinedResults);
    } catch (error) {
      console.error('書籍検索エラー:', error);
      toast.error('検索中にエラーが発生しました');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
  };

  const handleAddBook = async () => {
    if (!selectedBook || !userId) {
      toast.error('書籍が選択されていないか、ユーザーが認証されていません');
      return;
    }

    try {
      const result = await addBookToUserShelf(userId, selectedBook, selectedStatus);

      if (result) {
        toast.success('蔵書に追加しました');
        // フォームをリセット
        setSearchTerm('');
        setSearchResults([]);
        setSelectedBook(null);
      } else {
        toast.error('書籍の追加に失敗しました');
      }
    } catch (error) {
      console.error('書籍追加エラー:', error);
      toast.error('書籍の追加中にエラーが発生しました');
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

      setSelectedBook(mockScannedBook);
      toast.success('書籍情報を取得しました');
    }, 2000);
  };

  return (
    <div className="space-y-6 py-2">
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
                      {book.isbn && (
                        <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                    {selectedBook.isbn && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ISBN: {selectedBook.isbn}
                      </p>
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
              <Button className="flex-1" onClick={handleAddBook}>
                追加する
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
