'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback } from 'react';

import { getDifficultyInfo } from '@/lib/utils';
import { Book } from '@/types';

type BookCardProps = {
  book: Book;
};

export default function BookCard({ book }: BookCardProps) {
  const difficultyInfo = getDifficultyInfo(book.avg_difficulty);
  const DifficultyIcon = difficultyInfo.icon;

  // 詳細ページへの遷移前に書籍データをセッションストレージに保存
  const saveBookToSession = useCallback(() => {
    try {
      // セッションストレージに書籍情報を保存
      sessionStorage.setItem(`book_${book.id}`, JSON.stringify(book));

      // 既存の保存フラグがあっても、新たにページ遷移する場合はリセットする
      // これにより、別のセッションや以前のエラー後に再度保存を試みることができる
      const currentFlag = sessionStorage.getItem(`book_${book.id}_saved`);
      if (currentFlag) {
        console.log(`📚 既存の保存フラグをリセット: ${currentFlag} → null`);
        sessionStorage.removeItem(`book_${book.id}_saved`);
      }

      console.log(`📚 書籍情報をセッションストレージに保存: ${book.title}`);
    } catch (error) {
      console.error('セッションストレージへの保存エラー:', error);
    }
  }, [book]);

  return (
    <Link href={`/book/${book.id}`} onClick={saveBookToSession}>
      <motion.div
        className="group relative border border-border bg-card transition-colors overflow-hidden"
        whileHover={{ y: -5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
          <div className="relative w-full h-full transition-all duration-300 ease-out group-hover:scale-[1.01]">
            <Image
              src={book.img_url}
              alt={book.title}
              fill
              className="object-contain object-top"
              sizes="(max-width: 640px) 40vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              priority={false}
              quality={85}
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJNQNlw9Q6ZAAAAABJRU5ErkJggg=="
              placeholder="blur"
            />
            <div className="absolute inset-x-0 bottom-0 h-[33%] bg-transparent flex flex-col justify-end p-4">
              {/* グラデーション実装（一時的に無効化）: bg-gradient-to-t from-gray-800 via-gray-800/80 to-transparent dark:from-white dark:via-white/80 dark:to-transparent */}
              <h3 className="hidden font-semibold text-white dark:text-black truncate group-hover:text-primary transition-colors">
                {/* タイトル実装（一時的に非表示）: {book.title} */}
              </h3>
              <div className="flex items-center justify-end mt-1.5">
                {/* <p className="text-xs text-gray-300 dark:text-gray-600 truncate max-w-[60%]">{book.author}</p> */}
                {difficultyInfo.label !== '不明' && (
                  <div
                    className={`text-xs py-0.5 px-2 rounded-full whitespace-nowrap w-fit min-w-[4rem] flex-shrink-0 ml-1 font-medium flex items-center justify-center border ${
                      difficultyInfo.color === 'difficulty-easy'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : difficultyInfo.color === 'difficulty-somewhat-easy'
                          ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                          : difficultyInfo.color === 'difficulty-normal'
                            ? 'bg-green-50 text-green-600 border-green-200'
                            : difficultyInfo.color === 'difficulty-somewhat-hard'
                              ? 'bg-blue-50 text-blue-600 border-blue-200'
                              : difficultyInfo.color === 'difficulty-hard'
                                ? 'bg-purple-50 text-purple-600 border-purple-200'
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    <DifficultyIcon className="h-3 w-3 flex-shrink-0 mr-0.5" />
                    <span>{difficultyInfo.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
