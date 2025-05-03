'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import BookCard from '@/components/home/BookCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllBooksFromDB } from '@/lib/supabase/books';
import { Book } from '@/types';

export default function BookGrid() {
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    // データベースから書籍を取得
    const fetchBooks = async () => {
      try {
        const fetchedBooks = await getAllBooksFromDB();
        setBooks(fetchedBooks);
        setLoading(false);
      } catch (error) {
        console.error('書籍データの取得に失敗しました:', error);
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) {
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

  // 書籍がない場合のメッセージ
  if (books.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">書籍が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {books.map(book => (
        <motion.div key={book.id} variants={item}>
          <BookCard book={book} />
        </motion.div>
      ))}
    </motion.div>
  );
}
