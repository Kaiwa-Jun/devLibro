'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar, Clock, Users } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReadingCircle } from '@/types';

interface NextEventCardProps {
  event?: ReadingCircle & {
    books?: {
      id: string;
      title: string;
      author: string;
      img_url: string;
    };
  };
}

export function NextEventCard({ event }: NextEventCardProps) {
  if (!event) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">次の予定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-blue-300 mx-auto mb-4" />
            <p className="text-blue-700 font-medium">予定されている輪読会はありません</p>
            <p className="text-blue-600 text-sm mt-2">
              新しい輪読会を作成して仲間と学習を始めましょう
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={`/reading-circles/${event.id}`}>
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-blue-900">次の予定</CardTitle>
            <Badge className="bg-blue-100 text-blue-800">
              {event.start_date && format(new Date(event.start_date), 'M/d', { locale: ja })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {event.books && (
              <img
                src={event.books.img_url}
                alt={event.books.title}
                className="w-16 h-20 object-cover rounded shadow-sm flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-blue-900 line-clamp-2 mb-2">{event.title}</h3>
              {event.books && (
                <p className="text-sm text-blue-700 line-clamp-1 mb-3">📖 {event.books.title}</p>
              )}
              <div className="space-y-2">
                {event.start_date && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {format(new Date(event.start_date), 'M月d日', { locale: ja })}
                      {event.end_date &&
                        ` 〜 ${format(new Date(event.end_date), 'M月d日', { locale: ja })}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Users className="w-4 h-4" />
                  <span>
                    {event.participant_count}/{event.max_participants}名参加
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
