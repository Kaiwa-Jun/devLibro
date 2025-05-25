'use client';

import { motion } from 'framer-motion';
import { Trophy, Twitter } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trackShare } from '@/lib/analytics/gtag';
import { Book } from '@/types';

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
}

export default function CongratulationsModal({ isOpen, onClose, book }: CongratulationsModalProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleTwitterShare = async () => {
    setIsSharing(true);
    try {
      const shareText = `📚 「${book.title}」を読み終えました！\n著者: ${book.author}\n\n#読書記録 #DevLibro`;
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      
      window.open(shareUrl, '_blank', 'width=550,height=420');
      
      trackShare(book.id, book.title, 'twitter');
      
      toast.success('Twitterで共有しました！');
    } catch (error) {
      console.error('Twitter共有エラー:', error);
      toast.error('共有に失敗しました');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center mb-6">
          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              duration: 0.8,
            }}
            whileHover={{ rotate: 10 }}
          >
            <div className="bg-yellow-100 p-4 rounded-full">
              <Trophy className="h-12 w-12 text-yellow-600" />
            </div>
          </motion.div>
        </div>

        <DialogHeader>
          <DialogTitle className="text-center">🎉 読了おめでとう！</DialogTitle>
          <DialogDescription className="text-center">
            素晴らしい！また一冊読み終えることができましたね。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="relative h-20 w-16 flex-shrink-0">
              <Image
                src={book.img_url || '/images/book-placeholder.png'}
                alt={book.title}
                fill
                className="object-cover rounded-md"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium line-clamp-2">{book.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
              {book.publisherName && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {book.publisherName}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTwitterShare}
              disabled={isSharing}
              className="flex-1 gap-2"
              variant="outline"
            >
              <Twitter className="h-4 w-4" />
              {isSharing ? '共有中...' : 'Xで共有'}
            </Button>
            <Button onClick={onClose} className="flex-1">
              閉じる
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
