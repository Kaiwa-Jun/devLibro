'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { getDifficultyInfo } from '@/lib/utils';
import { Book } from '@/types';

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
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <div className="relative aspect-[3/4]">
          <Image
            src={book.img_url}
            alt={book.title}
            fill
            className="object-cover bg-muted transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 40vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            priority={false}
            quality={85}
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJNQNlw9Q6ZAAAAABJRU5ErkJggg=="
            placeholder="blur"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4">
            <h3 className="font-medium text-white truncate group-hover:text-primary/90 transition-colors">
              {book.title}
            </h3>
            <p className="text-sm text-white/80 mt-1 truncate">{book.author}</p>
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
