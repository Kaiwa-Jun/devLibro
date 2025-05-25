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
    >
      {/* 書影 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-200">
        <Image
          src={userBook.book.img_url}
          alt={userBook.book.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />

        {/* ホバー時のオーバーレイ */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

        {/* 読書進捗アイコン */}
        <div
          className={`absolute top-2 right-2 p-1.5 rounded-full border ${getStatusBgColor()} backdrop-blur-sm`}
        >
          {getStatusIcon()}
        </div>
      </div>

      {/* 書籍タイトル（ホバー時に表示） */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-b-lg">
        <h3 className="text-white text-xs font-medium line-clamp-2 leading-tight">
          {userBook.book.title}
        </h3>
        <p className="text-white/80 text-xs mt-1 line-clamp-1">{userBook.book.author}</p>
      </div>
    </motion.div>
  );
}
