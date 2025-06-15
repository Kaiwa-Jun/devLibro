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
        <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {circle.title}
              </h3>
              <ReadingCircleStatusBadge status={circle.status} size="sm" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              {/* 書籍画像 */}
              <div className="relative h-20 w-14 flex-shrink-0">
                <Image
                  src={circle.bookCover}
                  alt={circle.bookTitle}
                  fill
                  className="object-cover rounded-md shadow-sm"
                  sizes="56px"
                />
              </div>

              {/* 輪読会情報 */}
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-1">{circle.bookTitle}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{circle.description}</p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {circle.status === 'recruiting'
                      ? `${circle.participants}/${circle.maxParticipants}人参加`
                      : `${circle.participants}人のメンバー`}
                  </div>
                  {circle.nextMeetingDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {circle.nextMeetingDate}
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
              <div className="pt-2 border-t border-muted">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <BookOpen className="h-4 w-4" />
                  <span>参加者募集中です</span>
                </div>

                {/* スケジュール候補の表示 */}
                {circle.scheduleCandidates && circle.scheduleCandidates.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>開催候補日時:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {circle.scheduleCandidates.slice(0, 3).map((schedule, _idx) => (
                        <span key={schedule.id} className="text-xs bg-muted px-2 py-0.5 rounded">
                          {DAYS_OF_WEEK[schedule.day_of_week]} {schedule.start_time}
                        </span>
                      ))}
                      {circle.scheduleCandidates.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          他{circle.scheduleCandidates.length - 3}件
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
