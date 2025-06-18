'use client';

import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import DeleteBookModal from '@/components/modals/DeleteBookModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteUserBook, updateUserBookStatus } from '@/lib/supabase/user-books';
import { formatDate } from '@/lib/utils';
import { UserBook } from '@/types';

type BookshelfItemProps = {
  userBook: UserBook;
  onUpdate?: (
    updatedBook?: UserBook,
    action?: 'update' | 'delete',
    newStatus?: 'unread' | 'reading' | 'done'
  ) => void; // 書籍が更新または削除された時に親コンポーネントに通知
};

export default function BookshelfItem({ userBook, onUpdate }: BookshelfItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // ローカルでユーザーブックの状態を管理
  const [localUserBook, setLocalUserBook] = useState<UserBook>(userBook);

  const getStatusIcon = () => {
    switch (localUserBook.status) {
      case 'unread':
        return <LucideIcons.Clock className="h-4 w-4" />;
      case 'reading':
        return <LucideIcons.BookOpen className="h-4 w-4" />;
      case 'done':
        return <LucideIcons.Check className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (localUserBook.status) {
      case 'unread':
        return 'これから読む';
      case 'reading':
        return '読書中';
      case 'done':
        return '読了';
    }
  };

  // ステータス変更処理
  const handleStatusChange = async (newStatus: 'unread' | 'reading' | 'done') => {
    if (localUserBook.status === newStatus) return; // 同じステータスなら何もしない

    setIsLoading(true);
    try {
      const success = await updateUserBookStatus(localUserBook.id, newStatus);
      if (success) {
        // ローカルの状態を先に更新
        const now = new Date().toISOString();
        const updatedUserBook = {
          ...localUserBook,
          status: newStatus,
          finished_at: newStatus === 'done' ? now : null,
        };
        setLocalUserBook(updatedUserBook);

        toast.success(
          `「${localUserBook.book.title}」を${getStatusTextByValue(newStatus)}に設定しました`
        );

        // 読了モーダルは親コンポーネント（BookshelfTabs）で管理されるため、ここでは何もしない

        if (onUpdate) {
          // 親コンポーネントに更新情報を通知
          onUpdate(updatedUserBook, 'update', newStatus);
        }
      } else {
        toast.error('ステータスの更新に失敗しました');
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      toast.error('ステータスの更新中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 削除処理
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const success = await deleteUserBook(localUserBook.id);
      if (success) {
        toast.success(`「${localUserBook.book.title}」を本棚から削除しました`);
        setIsDeleted(true);
        setIsDeleteModalOpen(false);
        if (onUpdate) {
          // 親コンポーネントに削除情報を通知
          onUpdate(localUserBook, 'delete');
        }
      } else {
        toast.error('書籍の削除に失敗しました');
      }
    } catch (error) {
      console.error('書籍削除エラー:', error);
      toast.error('書籍の削除中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 削除モーダルを開く
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  // ステータス値からテキストを取得
  const getStatusTextByValue = (status: 'unread' | 'reading' | 'done') => {
    switch (status) {
      case 'unread':
        return 'これから読む';
      case 'reading':
        return '読書中';
      case 'done':
        return '読了';
    }
  };

  // 削除された場合は表示しない
  if (isDeleted) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            <Link href={`/book/${localUserBook.book.id}`} className="flex-shrink-0">
              <div className="relative h-28 w-20">
                <Image
                  src={localUserBook.book.img_url}
                  alt={localUserBook.book.title}
                  fill
                  className="object-cover rounded-sm"
                  sizes="80px"
                />
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/book/${localUserBook.book.id}`}>
                  <h3 className="font-medium line-clamp-1 hover:text-primary transition-colors">
                    {localUserBook.book.title}
                  </h3>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <LucideIcons.MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {localUserBook.status !== 'unread' && (
                      <DropdownMenuItem onClick={() => handleStatusChange('unread')}>
                        これから読むに設定
                      </DropdownMenuItem>
                    )}
                    {localUserBook.status !== 'reading' && (
                      <DropdownMenuItem onClick={() => handleStatusChange('reading')}>
                        読書中に設定
                      </DropdownMenuItem>
                    )}
                    {localUserBook.status !== 'done' && (
                      <DropdownMenuItem onClick={() => handleStatusChange('done')}>
                        読了に設定
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-destructive" onClick={handleDeleteClick}>
                      本棚から削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-1">
                {localUserBook.book.author}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="gap-1">
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                </Badge>

                {localUserBook.added_at && (
                  <span className="text-xs text-muted-foreground">
                    追加: {formatDate(localUserBook.added_at)}
                  </span>
                )}
              </div>

              {/* 進捗表示は非表示に
              {localUserBook.status === 'reading' && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>進捗</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 削除確認モーダル */}
      <DeleteBookModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        bookTitle={localUserBook.book.title}
        isLoading={isLoading}
      />
    </motion.div>
  );
}
