'use client';

import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import AddBookModal from '@/components/modals/AddBookModal';
import CongratulationsModal from '@/components/modals/CongratulationsModal';
import BookCoverItem from '@/components/profile/BookCoverItem';
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
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'reading' | 'done'>('all');

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

  // 読了おめでとうモーダルの状態管理
  const [congratulationsModal, setCongratulationsModal] = useState<{
    isOpen: boolean;
    book: UserBook['book'] | null;
  }>({
    isOpen: false,
    book: null,
  });

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

        // 読了に変更された場合はモーダルを表示
        if (newStatus === 'done') {
          console.log('BookshelfTabs: 読了おめでとうモーダルを表示します');
          setCongratulationsModal({
            isOpen: true,
            book: updatedBook.book,
          });
        }
      }

      // タブ切り替え（状態を更新した後に）
      setActiveTab(newStatus);
    }

    // ローディング表示なしでバックグラウンドでデータ更新
    refreshUserBooks(false);
  };

  // 書籍追加時の処理
  const handleBookAdded = (status: 'unread' | 'reading' | 'done') => {
    console.log('BookshelfTabs: handleBookAdded called', { status, currentTab: activeTab });

    // 「すべて」以外のタブが選択されている場合、追加されたステータスのタブに切り替え
    if (activeTab !== 'all') {
      console.log(`書籍追加後にタブを切り替えます: ${status}`);
      setActiveTab(status);
    }

    // データを更新
    refreshUserBooks(false);
  };

  // 書影クリック時の処理（すべての書籍タブから該当するタブに切り替え）
  const handleBookCoverClick = (status: 'unread' | 'reading' | 'done') => {
    setActiveTab(status);
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
                onBookAdded={handleBookAdded}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs
          defaultValue={activeTab}
          value={activeTab}
          onValueChange={value => {
            console.log(`タブが手動で切り替えられました: ${value}`);
            setActiveTab(value as 'all' | 'unread' | 'reading' | 'done');
          }}
          className="relative"
        >
          <div className="relative">
            <TabsList className="grid w-full grid-cols-4 relative z-10">
              <TabsTrigger value="all" className="relative z-10">
                すべて ({userBooks.length})
              </TabsTrigger>
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
                width: `calc(100% / 4)`,
              }}
              animate={{
                x:
                  activeTab === 'all'
                    ? 0
                    : activeTab === 'unread'
                      ? `100%`
                      : activeTab === 'reading'
                        ? `200%`
                        : `300%`,
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
            value="all"
            className="mt-6 focus-visible:outline-none focus-visible:ring-0"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {userBooks.length > 0 ? (
                  userBooks.map(userBook => (
                    <BookCoverItem
                      key={userBook.id}
                      userBook={userBook}
                      onBookClick={handleBookCoverClick}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    本棚に書籍がありません
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>

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

        {/* 読了おめでとうモーダル */}
        {congratulationsModal.book && (
          <CongratulationsModal
            isOpen={congratulationsModal.isOpen}
            onClose={() => setCongratulationsModal({ isOpen: false, book: null })}
            book={congratulationsModal.book}
          />
        )}
      </div>
    );
  }

  return renderContent();
}
