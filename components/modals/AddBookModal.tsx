'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, Camera, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/useDebounce';

export default function AddBookModal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'unread' | 'reading' | 'done'>('unread');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleSearch = async () => {
    if (!debouncedSearchTerm) return;

    setIsSearching(true);

    // 実際の実装ではGoogle Books APIを呼び出す
    try {
      // モック検索結果
      setTimeout(() => {
        const mockResults = [
          {
            id: 'book1',
            title: 'プログラミング TypeScript',
            author: 'Boris Cherny',
            img_url:
              'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=800',
            publisher: "O'Reilly Media",
            isbn: '9784873119045',
          },
          {
            id: 'book2',
            title: 'JavaScript 第7版',
            author: 'David Flanagan',
            img_url:
              'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
            publisher: "O'Reilly Media",
            isbn: '9784873119700',
          },
        ];

        setSearchResults(mockResults);
        setIsSearching(false);
      }, 1000);
    } catch (error) {
      toast.error('検索中にエラーが発生しました');
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book: any) => {
    setSelectedBook(book);
  };

  const handleAddBook = () => {
    if (!selectedBook) return;

    // 実際の実装ではここでAPI呼び出し
    console.log({ book: selectedBook, status: selectedStatus });
    toast.success('蔵書に追加しました');

    // フォームをリセット
    setSearchTerm('');
    setSearchResults([]);
    setSelectedBook(null);
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

        <Button onClick={handleSearch} disabled={!searchTerm || isSearching} className="w-full">
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              検索中...
            </>
          ) : (
            '検索'
          )}
        </Button>
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
                        src={book.img_url}
                        alt={book.title}
                        fill
                        className="object-cover rounded-sm"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium line-clamp-1">{book.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {book.publisher} | ISBN: {book.isbn}
                      </p>
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
              <CardContent className="p-4 flex gap-4">
                <div className="relative h-24 w-18 flex-shrink-0">
                  <Image
                    src={selectedBook.img_url}
                    alt={selectedBook.title}
                    fill
                    className="object-cover rounded-sm"
                    sizes="72px"
                  />
                </div>
                <div>
                  <h4 className="font-medium">{selectedBook.title}</h4>
                  <p className="text-sm text-muted-foreground">{selectedBook.author}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedBook.publisher}</p>
                  <p className="text-xs text-muted-foreground">ISBN: {selectedBook.isbn}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">ステータス</h3>
              <Tabs value={selectedStatus} onValueChange={value => setSelectedStatus(value as any)}>
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
