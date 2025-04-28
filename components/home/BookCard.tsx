'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Book } from '@/types';
import { Badge } from '@/components/ui/badge';
import { getDifficultyInfo } from '@/lib/utils';

type BookCardProps = {
  book: Book;
};

export default function BookCard({ book }: BookCardProps) {
  const difficultyInfo = getDifficultyInfo(book.avg_difficulty);
  const DifficultyIcon = difficultyInfo.icon;

  return (
    <Link href={`/book/${book.id}`}>
      <motion.div 
        className="group relative rounded-lg overflow-hidden border border-border bg-card transition-colors"
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <div className="relative aspect-[3/4]">
          <Image
            src={book.img_url}
            alt={book.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4">
            <h3 className="font-medium text-white truncate group-hover:text-primary/90 transition-colors">
              {book.title}
            </h3>
            <p className="text-sm text-white/80 mt-1 truncate">
              {book.author}
            </p>
            <div className="mt-2 flex items-center">
              <Badge 
                variant="outline"
                className="bg-white/20 hover:bg-white/30 gap-1.5 border-white/20"
                style={{ color: `var(--${difficultyInfo.color})` }}
              >
                <DifficultyIcon style={{ color: `var(--${difficultyInfo.color})` }} />
                <span>{difficultyInfo.label}</span>
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}