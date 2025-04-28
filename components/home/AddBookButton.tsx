'use client';

import { Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AddBookModal from '@/components/modals/AddBookModal';

export default function AddBookButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div className="absolute right-0 top-0">
          <Button
            size="icon"
            className="rounded-full w-11 h-11"
            whileTap={{ scale: 0.9 }}
          >
            <Camera className="h-5 w-5" />
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>書籍を追加</DialogTitle>
        </DialogHeader>
        <AddBookModal />
      </DialogContent>
    </Dialog>
  );
}