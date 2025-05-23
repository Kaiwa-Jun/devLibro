'use client';

import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bookTitle: string;
  isLoading?: boolean;
}

export default function DeleteBookModal({
  isOpen,
  onClose,
  onConfirm,
  bookTitle,
  isLoading = false,
}: DeleteBookModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>本棚から削除</DialogTitle>
          </div>
          <DialogDescription>
            「{bookTitle}」を本棚から削除しますか？
            <br />
            この操作は取り消すことができません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            削除する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
