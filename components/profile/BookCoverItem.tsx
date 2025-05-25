'use client';

import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';

import { UserBook } from '@/types';

type BookCoverItemProps = {
  userBook: UserBook;
  onBookClick: (status: 'unread' | 'reading' | 'done') => void;
};

export default function BookCoverItem({ userBook, onBookClick }: BookCoverItemProps) {
  const getStatusIcon = () => {
    switch (userBook.status) {
      case 'unread':
        return <LucideIcons.Clock className="h-3 w-3 text-orange-500" />;
      case 'reading':
        return <LucideIcons.BookOpen className="h-3 w-3 text-blue-500" />;
      case 'done':
        return <LucideIcons.Check className="h-3 w-3 text-green-500" />;
    }
  };

  const getStatusBgColor = () => {
    switch (userBook.status) {
      case 'unread':
        return 'bg-orange-100 border-orange-200';
      case 'reading':
        return 'bg-blue-100 border-blue-200';
      case 'done':
        return 'bg-green-100 border-green-200';
    }
  };

  const handleClick = () => {
    onBookClick(userBook.status);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="relative cursor-pointer group"
      onClick={handleClick}
      whileHover={{ y: -5 }}
    >
      {/* 書影 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden shadow-md transition-shadow duration-200">
        <Image
          src={userBook.book.img_url}
          alt={userBook.book.title}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-[1.01]"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />

        {/* 読書進捗アイコン */}
        <div
          className={`absolute top-2 right-2 p-1.5 rounded-full border ${getStatusBgColor()} backdrop-blur-sm`}
        >
          {getStatusIcon()}
        </div>
      </div>
    </motion.div>
  );
}
