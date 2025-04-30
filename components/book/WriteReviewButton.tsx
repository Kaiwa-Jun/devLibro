'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { MessageSquarePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import ReviewModal from '@/components/modals/ReviewModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

interface WriteReviewButtonProps {
  bookId?: string;
}

export default function WriteReviewButton({ bookId = '1' }: WriteReviewButtonProps) {
  const ref = useRef(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [1, 0.8]);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleClose = () => {
    setOpen(false);
  };

  const handleButtonClick = () => {
    if (!user) {
      toast({
        title: 'ログインが必要です',
        description: 'レビューを投稿するにはログインしてください',
        variant: 'destructive',
      });
      router.push('/login?redirectFrom=review');
      return;
    }
    setOpen(true);
  };

  // ログインしていない場合はボタンを表示しない選択肢もあります
  // if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <motion.div
        className="fixed bottom-20 right-4 z-10 rounded-lg shadow-lg"
        ref={ref}
        style={{ opacity }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          className="h-11 px-6 font-medium gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
          onClick={handleButtonClick}
        >
          <MessageSquarePlus className="h-5 w-5" />
          <span>レビューを書く</span>
        </Button>
      </motion.div>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>レビューを投稿</DialogTitle>
        </DialogHeader>
        <ReviewModal bookId={bookId} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
