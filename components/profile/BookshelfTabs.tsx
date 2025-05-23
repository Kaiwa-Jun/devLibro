'use client';

import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
import { getUser } from '@/lib/supabase/client';
import { getUserBooks } from '@/lib/supabase/user-books';
import { UserBook } from '@/types';

export default function BookshelfTabs() {
  const [loading, setLoading] = useState(true);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'unread' | 'reading' | 'done'>('unread');

  useEffect(() => {
    async function fetchUserBooks() {
      try {
        // ユーザーIDを取得
        const { user, error: userError } = await getUser();

        if (userError || !user) {
          console.error('ユーザー取得エラー:', userError);
          setError('ユーザー情報の取得に失敗しました');
          setLoading(false);
          return;
        }

        // ユーザーの本棚データを取得
        const books = await getUserBooks(user.id);
        console.log(`${books.length}冊の書籍を取得しました`);
        setUserBooks(books);
      } catch (error) {
        console.error('本棚データの取得に失敗しました:', error);
        setError('本棚データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }

    fetchUserBooks();
  }, []);

  // 画面表示時にデータを再取得するための関数
  const refreshUserBooks = async (showLoading = true) => {
    // ローディングフラグを表示するかどうかを制御可能に
    if (showLoading) {
      setLoading(true);
    }

    try {
      const { user } = await getUser();
      if (user) {
        const books = await getUserBooks(user.id);
        setUserBooks(books);
        console.log('本棚データを更新しました');
      }
    } catch (error) {
      console.error('本棚データの更新に失敗しました:', error);
      toast.error('データの更新に失敗しました');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const unreadBooks = userBooks.filter(book => book.status === 'unread');
  const readingBooks = userBooks.filter(book => book.status === 'reading');
  const doneBooks = userBooks.filter(book => book.status === 'done');

  // 書籍ステータス更新時の処理
  const handleBookUpdate = (
    updatedBook?: UserBook,
    action?: 'update' | 'delete',
    newStatus?: 'unread' | 'reading' | 'done'
  ) => {
    console.log('BookshelfTabs: handleBookUpdate called', { updatedBook, action, newStatus });

    // 更新時にはすぐにタブを切り替え
    if (action === 'update' && newStatus) {
      console.log(`タブを切り替えます: ${newStatus}`);

      // ローカルの状態を即時更新
      if (updatedBook) {
        setUserBooks(prev =>
          prev.map(book =>
            book.id === updatedBook.id
              ? {
                  ...book,
                  status: newStatus,
                  finished_at: newStatus === 'done' ? new Date().toISOString() : null,
                }
              : book
          )
        );
      }

      // タブ切り替え（状態を更新した後に）
      setActiveTab(newStatus);
    }

    // ローディング表示なしでバックグラウンドでデータ更新
    refreshUserBooks(false);
  };

  if (loading) {
    // すでに本の情報が読み込まれている場合は、スケルトン表示せずに現在のコンテンツを表示
    if (userBooks.length > 0) {
      return renderContent();
    }

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

  if (error) {
    return (
      <div className="mt-8 text-center">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => refreshUserBooks(true)}>
          再読み込み
        </Button>
      </div>
    );
  }

  // コンテンツ描画関数を定義
  function renderContent() {
    return (
      <div className="mt-6">
        <div className="flex justify-end mb-4">
          <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <LucideIcons.Plus className="h-4 w-4" />
                <span>書籍を追加</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[80vw] sm:max-w-2xl rounded-xl">
              <DialogHeader>
                <DialogTitle>書籍を追加</DialogTitle>
              </DialogHeader>
              <AddBookModal
                onClose={() => {
                  setIsAddBookOpen(false);
                  refreshUserBooks(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={value => {
            console.log(`タブが手動で切り替えられました: ${value}`);
            setActiveTab(value as 'unread' | 'reading' | 'done');
          }}
          className="relative"
        >
          <div className="relative">
            <TabsList className="grid w-full grid-cols-3 relative z-10">
              <TabsTrigger value="unread" className="relative z-10">
                これから読む ({unreadBooks.length})
              </TabsTrigger>
              <TabsTrigger value="reading" className="relative z-10">
                読書中 ({readingBooks.length})
              </TabsTrigger>
              <TabsTrigger value="done" className="relative z-10">
                読了 ({doneBooks.length})
              </TabsTrigger>
            </TabsList>
            {/* アクティブインジケーターアニメーション */}
            <motion.div
              className="absolute h-[calc(100%-8px)] top-[4px] rounded-sm bg-background shadow-sm z-0"
              style={{
                width: `calc(100% / 3)`,
              }}
              animate={{
                x: activeTab === 'unread' ? 0 : activeTab === 'reading' ? `100%` : `200%`,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 35,
                mass: 1.2,
                velocity: 2,
              }}
              layout
            />
          </div>

          <TabsContent
            value="unread"
            className="mt-6 focus-visible:outline-none focus-visible:ring-0"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                {unreadBooks.length > 0 ? (
                  unreadBooks.map(userBook => (
                    <BookshelfItem
                      key={userBook.id}
                      userBook={userBook}
                      onUpdate={handleBookUpdate}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    これから読む本はありません
                  </p>
                )}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent
            value="reading"
            className="mt-6 focus-visible:outline-none focus-visible:ring-0"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                {readingBooks.length > 0 ? (
                  readingBooks.map(userBook => (
                    <BookshelfItem
                      key={userBook.id}
                      userBook={userBook}
                      onUpdate={handleBookUpdate}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">読書中の本はありません</p>
                )}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent
            value="done"
            className="mt-6 focus-visible:outline-none focus-visible:ring-0"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-4">
                {doneBooks.length > 0 ? (
                  doneBooks.map(userBook => (
                    <BookshelfItem
                      key={userBook.id}
                      userBook={userBook}
                      onUpdate={handleBookUpdate}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">読了した本はありません</p>
                )}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return renderContent();
}
