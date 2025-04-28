'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { MessageSquarePlus } from 'lucide-react';
import { useRef, useState } from 'react';

import ReviewModal from '@/components/modals/ReviewModal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface WriteReviewButtonProps {
  bookId?: string;
}

export default function WriteReviewButton({ bookId = '1' }: WriteReviewButtonProps) {
  const ref = useRef(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [1, 0.8]);
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          className="fixed bottom-20 right-4 z-10 rounded-lg shadow-lg"
          ref={ref}
          style={{ opacity }}
          whileTap={{ scale: 0.95 }}
        >
          <Button className="h-11 px-6 font-medium gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <MessageSquarePlus className="h-5 w-5" />
            <span>レビューを書く</span>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>レビューを投稿</DialogTitle>
        </DialogHeader>
        <ReviewModal bookId={bookId} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
