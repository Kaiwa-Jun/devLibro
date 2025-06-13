'use client';

import { Users } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReadingCircle } from '@/types';

import { CircleProgressBar } from './CircleProgressBar';
import { CircleStatusBadge } from './CircleStatusBadge';

interface MyReadingGroupsCardProps {
  circle: ReadingCircle & {
    books?: {
      id: string;
      title: string;
      author: string;
      img_url: string;
    };
    currentProgress?: number;
    totalPages?: number;
  };
}

export function MyReadingGroupsCard({ circle }: MyReadingGroupsCardProps) {
  return (
    <Link href={`/reading-circles/${circle.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CircleStatusBadge circle={circle} className="mb-2" />
              <CardTitle className="text-lg leading-tight line-clamp-2 mb-1">
                {circle.title}
              </CardTitle>
              {circle.books && (
                <p className="text-sm text-gray-600 line-clamp-1">📖 {circle.books.title}</p>
              )}
            </div>
            {circle.books && (
              <img
                src={circle.books.img_url}
                alt={circle.books.title}
                className="w-12 h-16 object-cover rounded flex-shrink-0"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* 参加者情報 */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>
                {circle.participant_count}/{circle.max_participants}名参加
              </span>
            </div>

            {/* 進捗バー */}
            <CircleProgressBar
              currentProgress={circle.currentProgress || 0}
              totalPages={circle.totalPages || 100}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
