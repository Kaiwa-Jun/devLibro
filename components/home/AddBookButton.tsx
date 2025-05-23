'use client';

import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

import AddBookModal from '@/components/modals/AddBookModal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AddBookButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div className="absolute right-0 top-0" whileTap={{ scale: 0.9 }}>
          <Button size="icon" className="rounded-full w-11 h-11">
            <Camera className="h-5 w-5" />
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="w-[80vw] sm:max-w-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle>書籍を追加</DialogTitle>
        </DialogHeader>
        <AddBookModal />
      </DialogContent>
    </Dialog>
  );
}
