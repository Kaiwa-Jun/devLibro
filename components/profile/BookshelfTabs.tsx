'use client';

import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useState, useEffect } from 'react';

import AddBookModal from '@/components/modals/AddBookModal';
import BookshelfItem from '@/components/profile/BookshelfItem';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockUserBooks } from '@/lib/mock-data';
import { UserBook } from '@/types';

export default function BookshelfTabs() {
  const [loading, setLoading] = useState(true);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);

  useEffect(() => {
    // 実際の実装ではここでAPI呼び出し
    const timer = setTimeout(() => {
      setUserBooks(mockUserBooks);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const unreadBooks = userBooks.filter(book => book.status === 'unread');
  const readingBooks = userBooks.filter(book => book.status === 'reading');
  const doneBooks = userBooks.filter(book => book.status === 'done');

  if (loading) {
    return (
      <div className="space-y-6 mt-8">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex justify-end mb-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <LucideIcons.Plus className="h-4 w-4" />
              <span>書籍を追加</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>書籍を追加</DialogTitle>
            </DialogHeader>
            <AddBookModal />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="unread">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="unread">未読 ({unreadBooks.length})</TabsTrigger>
          <TabsTrigger value="reading">読書中 ({readingBooks.length})</TabsTrigger>
          <TabsTrigger value="done">読了 ({doneBooks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="mt-6">
          <AnimatePresence>
            <motion.div className="space-y-4">
              {unreadBooks.length > 0 ? (
                unreadBooks.map(userBook => <BookshelfItem key={userBook.id} userBook={userBook} />)
              ) : (
                <p className="text-center text-muted-foreground py-8">未読の本はありません</p>
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="reading" className="mt-6">
          <AnimatePresence>
            <motion.div className="space-y-4">
              {readingBooks.length > 0 ? (
                readingBooks.map(userBook => (
                  <BookshelfItem key={userBook.id} userBook={userBook} />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">読書中の本はありません</p>
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="done" className="mt-6">
          <AnimatePresence>
            <motion.div className="space-y-4">
              {doneBooks.length > 0 ? (
                doneBooks.map(userBook => <BookshelfItem key={userBook.id} userBook={userBook} />)
              ) : (
                <p className="text-center text-muted-foreground py-8">読了した本はありません</p>
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
