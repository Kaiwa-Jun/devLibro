'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar, Clock, Globe, Lock, Users } from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ReadingCircle, getCircleStatus, statusLabels } from '@/types';

interface ReadingCircleCardProps {
  circle: ReadingCircle & {
    books?: {
      id: string;
      title: string;
      author: string;
      img_url: string;
    };
    users?: {
      id: string;
      display_name: string;
    };
  };
}

export function ReadingCircleCard({ circle }: ReadingCircleCardProps) {
  // リアルタイムステータス判定を使用
  const currentStatus = getCircleStatus(circle);
  const statusInfo = statusLabels[currentStatus as keyof typeof statusLabels] || statusLabels.draft;

  return (
    <Link href={`/reading-circles/${circle.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {circle.is_private ? (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>プライベート</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3" />
                      <span>公開</span>
                    </>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-2">
                {circle.title}
              </h3>
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
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>
                  {circle.participant_count}/{circle.max_participants}名
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-gray-100">
                    {circle.users?.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-500">
                  {circle.users?.display_name || '不明'}
                </span>
              </div>
            </div>

            {/* 日程情報 */}
            <div className="space-y-1 text-xs text-gray-500">
              {circle.start_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-green-500" />
                  <span>
                    開始予定: {format(new Date(circle.start_date), 'M/d', { locale: ja })}
                    {circle.end_date &&
                      `〜${format(new Date(circle.end_date), 'M/d', { locale: ja })}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(circle.created_at), 'M/d 作成', { locale: ja })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
