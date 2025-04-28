'use client';

import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Info, Share2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { mockBooks } from '@/lib/mock-data';
import { getDifficultyInfo } from '@/lib/utils';
import { Book } from '@/types';

type BookDetailProps = {
  id: string;
};

export default function BookDetail({ id }: BookDetailProps) {
  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    // 実際の実装ではここでAPI呼び出し
    const timer = setTimeout(() => {
      const foundBook = mockBooks.find(b => b.id === id) || mockBooks[0];
      setBook(foundBook);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading || !book) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="h-[240px] w-[180px] flex-shrink-0" />
            <div className="space-y-4 flex-1">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const difficultyInfo = getDifficultyInfo(book.avg_difficulty);
  const DifficultyIcon = difficultyInfo.icon;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-[240px] w-[180px] flex-shrink-0 mx-auto md:mx-0"
          >
            <Image
              src={book.img_url}
              alt={book.title}
              fill
              className="object-cover rounded-md"
              sizes="180px"
            />
          </motion.div>

          <div className="flex-1 space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold">{book.title}</h1>
              <p className="text-muted-foreground">{book.author}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-2"
            >
              <Badge variant="outline" className="border">
                ISBN: {book.isbn}
              </Badge>
              <Badge variant="outline" className="border">
                {book.language}
              </Badge>
              {book.categories.map(category => (
                <Badge key={category} variant="outline" className="border">
                  {category}
                </Badge>
              ))}
              <Badge
                variant="outline"
                className="gap-1.5 border"
                style={{ color: `var(--${difficultyInfo.color})` }}
              >
                <DifficultyIcon style={{ color: `var(--${difficultyInfo.color})` }} />
                <span>{difficultyInfo.label}</span>
              </Badge>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground"
            >
              {book.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-2 pt-2"
            >
              <Button variant="outline" className="gap-2" asChild>
                <a href="https://amazon.co.jp" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  <span>Amazon</span>
                </a>
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <a href="https://books.rakuten.co.jp" target="_blank" rel="noopener noreferrer">
                  <BookOpen className="h-4 w-4" />
                  <span>楽天Books</span>
                </a>
              </Button>
            </motion.div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  シェア
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href="https://example.com/amazon" target="_blank" rel="noopener noreferrer">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Amazonで購入
                  </a>
                </Button>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href="https://example.com/more" target="_blank" rel="noopener noreferrer">
                  <Info className="mr-2 h-4 w-4" />
                  詳細情報
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
