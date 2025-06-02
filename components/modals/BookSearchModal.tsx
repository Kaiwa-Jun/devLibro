'use client';

import { Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { searchBooksWithSuggestions } from '@/lib/api/books';
import { Book } from '@/types';

interface BookSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (book: Book) => void;
}

export function BookSearchModal({ isOpen, onClose, onSelect }: BookSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const debouncedSearchTerm = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch(true); // 新しい検索の場合はリセット
    } else {
      setSearchResults([]);
      setHasMore(false);
      setCurrentPage(0);
    }
  }, [debouncedSearchTerm]);

  const handleSearch = async (isNewSearch = false) => {
    if (!debouncedSearchTerm.trim()) return;

    const pageToLoad = isNewSearch ? 0 : currentPage + 1;
    const startIndex = pageToLoad * 20;

    if (isNewSearch) {
      setIsSearching(true);
      setSearchResults([]);
      setCurrentPage(0);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // ホーム画面と同じ検索ロジックを使用
      const { books, hasMore: moreAvailable } = await searchBooksWithSuggestions(
        debouncedSearchTerm,
        startIndex,
        20
      );

      if (isNewSearch) {
        setSearchResults(books);
      } else {
        setSearchResults(prev => [...prev, ...books]);
      }

      setHasMore(moreAvailable);
      setCurrentPage(pageToLoad);
    } catch (error) {
      console.error('検索エラー:', error);
      if (isNewSearch) {
        setSearchResults([]);
      }
      setHasMore(false);
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      handleSearch(false);
    }
  };

  const handleBookSelect = (book: Book) => {
    onSelect(book);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasMore(false);
    setCurrentPage(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>書籍を選択</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="書籍名、著者名、ISBNで検索..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>検索中...</span>
              </div>
            )}

            {!isSearching && searchResults.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                検索結果が見つかりませんでした
              </div>
            )}

            {!isSearching && searchResults.length === 0 && !searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                書籍名を入力して検索してください
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {searchResults.map(book => (
                <Card
                  key={book.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleBookSelect(book)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={book.img_url}
                      alt={book.title}
                      className="w-16 h-20 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-clamp-2 mb-1">{book.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
                      {book.categories && book.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {book.categories.slice(0, 3).map((category, index) => (
                            <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      選択
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* もっと見るボタン */}
            {hasMore && !isSearching && searchResults.length > 0 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      読み込み中...
                    </>
                  ) : (
                    'もっと見る'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
