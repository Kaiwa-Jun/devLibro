'use client';

import { ArrowLeft, Book as BookIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import BookCard from '@/components/home/BookCard';
import { Button } from '@/components/ui/button';
import { searchBooksByTitle } from '@/lib/api/books';
import { Book } from '@/types';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      if (!query) {
        router.push('/');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await searchBooksByTitle(query);
        setBooks(results);
        if (results.length === 0) {
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
  }, [query, router]);

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
          <p className="text-muted-foreground mb-6">{books.length}件の検索結果</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {books.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
