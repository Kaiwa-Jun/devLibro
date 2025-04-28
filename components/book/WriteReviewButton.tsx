'use client';

import { useRef } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ReviewModal from '@/components/modals/ReviewModal';

export default function WriteReviewButton() {
  const ref = useRef(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [1, 0.8]);
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div 
          className="fixed bottom-20 right-4 z-10 rounded-lg shadow-lg"
          ref={ref}
          style={{ opacity }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            className="h-11 px-6 font-medium gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
          >
            <MessageSquarePlus className="h-5 w-5" />
            <span>レビューを書く</span>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>レビューを投稿</DialogTitle>
        </DialogHeader>
        <ReviewModal />
      </DialogContent>
    </Dialog>
  );
}