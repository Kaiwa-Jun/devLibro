'use client';

import { motion } from 'framer-motion';
import { BookOpen, Calendar, Clock, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

import ReadingCircleStatusBadge, { ReadingCircleStatus } from './ReadingCircleStatusBadge';
import ReadingProgressBar from './ReadingProgressBar';

interface MyReadingCircleCardProps {
  circle: {
    id: string;
    title: string;
    bookTitle: string;
    bookCover: string;
    participants: number;
    maxParticipants: number;
    progress: number;
    status: ReadingCircleStatus;
    nextMeetingDate?: string;
    description: string;
    scheduleCandidates?: Array<{
      id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
    }>;
    book_candidates?: Array<{
      id: string;
      title: string;
      cover: string;
    }>;
  };
  index: number;
}

export default function MyReadingCircleCard({ circle, index }: MyReadingCircleCardProps) {
  // 曜日の表示用配列
  const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="w-full"
    >
      <Link href={`/reading-circles/${circle.id}`}>
        <Card className="h-full hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer group border-0 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {circle.title}
              </h3>
              <ReadingCircleStatusBadge status={circle.status} size="sm" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex gap-4">
              {/* 書籍画像 */}
              <div className="relative h-24 w-16 flex-shrink-0">
                <Image
                  src={circle.bookCover}
                  alt={circle.bookTitle}
                  fill
                  className="object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  sizes="64px"
                />
              </div>

              {/* 輪読会情報 */}
              <div className="flex-1 min-w-0 space-y-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 line-clamp-1">
                  {circle.bookTitle}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {circle.description}
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-lg">
                      <Users className="h-3 w-3" />
                    </div>
                    <span className="font-medium">
                      {circle.status === 'recruiting'
                        ? `${circle.participants}/${circle.maxParticipants}人参加`
                        : `${circle.participants}人のメンバー`}
                    </span>
                  </div>
                  {circle.nextMeetingDate && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-lg">
                        <Calendar className="h-3 w-3" />
                      </div>
                      <span className="font-medium text-xs">{circle.nextMeetingDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* プログレスバー */}
            {circle.status !== 'recruiting' && (
              <ReadingProgressBar progress={circle.progress} size="sm" showLabel={true} />
            )}

            {/* 募集中の場合の追加情報 */}
            {circle.status === 'recruiting' && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm mb-3">
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-1 rounded-lg">
                    <BookOpen className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    参加者募集中です 🚀
                  </span>
                </div>

                {/* スケジュール候補の表示 */}
                {circle.scheduleCandidates && circle.scheduleCandidates.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>開催候補日時:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {circle.scheduleCandidates.slice(0, 3).map((schedule, _idx) => (
                        <span
                          key={schedule.id}
                          className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium"
                        >
                          {DAYS_OF_WEEK[schedule.day_of_week]} {schedule.start_time}
                        </span>
                      ))}
                      {circle.scheduleCandidates.length > 3 && (
                        <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          +{circle.scheduleCandidates.length - 3}件
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
