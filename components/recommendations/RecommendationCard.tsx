'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { getDifficultyInfo } from '@/lib/utils';
import { RecommendationWithBook } from '@/types';

interface RecommendationCardProps {
  recommendation: RecommendationWithBook;
  index: number;
}

export default function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  const { book, score, reasons, avgDifficulty, reviewCount, experienceLevelMatch } = recommendation;
  const difficultyInfo = getDifficultyInfo(avgDifficulty);
  const DifficultyIcon = difficultyInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="flex-shrink-0 w-80 max-w-full"
    >
      <Link href={`/book/${book.id}`} className="block h-full">
        <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex gap-4 mb-3">
              {/* 書籍画像 */}
              <div className="relative h-24 w-16 flex-shrink-0">
                <Image
                  src={book.img_url || '/images/book-placeholder.png'}
                  alt={book.title}
                  fill
                  className="object-cover rounded-md"
                  sizes="64px"
                />
              </div>

              {/* 書籍情報 */}
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-sm line-clamp-2 mb-1 h-10 leading-tight"
                  title={book.title}
                >
                  {book.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2" title={book.author}>
                  {book.author}
                </p>

                {/* おすすめ度と難易度 */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">おすすめ度</span>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.round(score / 20)
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div
                    className={`text-xs py-0.5 px-2 rounded-full whitespace-nowrap w-fit min-w-[4rem] flex-shrink-0 font-medium flex items-center justify-center border ${
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
                </div>

                {/* レビュー情報 */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{reviewCount}件のレビュー</span>
                  {experienceLevelMatch > 0 && <span>• 同レベル{experienceLevelMatch}件</span>}
                </div>
              </div>
            </div>

            {/* レコメンド理由 */}
            <div className="space-y-1 flex-1">
              {reasons.slice(0, 2).map((reason, idx) => (
                <div key={idx} className="text-xs text-muted-foreground">
                  {reason}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
