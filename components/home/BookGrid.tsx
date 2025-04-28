'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import BookCard from '@/components/home/BookCard';
import { Skeleton } from '@/components/ui/skeleton';
import { mockBooks } from '@/lib/mock-data';

export default function BookGrid() {
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<typeof mockBooks>([]);

  useEffect(() => {
    // 実際の実装ではここでAPI呼び出し
    const timer = setTimeout(() => {
      setBooks(mockBooks);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
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
