'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Users, Calendar, Lock, Globe } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ReadingCircle } from '@/types';

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
  isOrganizer?: boolean;
}

const statusLabels = {
  draft: { label: '下書き', variant: 'secondary' as const },
  recruiting: { label: '募集中', variant: 'default' as const },
  active: { label: '開催中', variant: 'default' as const },
  completed: { label: '終了', variant: 'outline' as const },
  cancelled: { label: 'キャンセル', variant: 'destructive' as const },
};

export function ReadingCircleCard({ circle, isOrganizer }: ReadingCircleCardProps) {
  const statusInfo = statusLabels[circle.status] || statusLabels.draft;

  return (
    <Link href={`/reading-circles/${circle.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg line-clamp-2 mb-2">{circle.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                {isOrganizer && <Badge variant="outline">主催者</Badge>}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {circle.is_private ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  <span>{circle.is_private ? 'プライベート' : '公開'}</span>
                </div>
              </div>
            </div>
            {circle.books && (
              <img
                src={circle.books.img_url}
                alt={circle.books.title}
                className="w-16 h-20 object-cover rounded flex-shrink-0"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {circle.books && (
            <div className="mb-4">
              <h4 className="font-medium text-sm mb-1">{circle.books.title}</h4>
              <p className="text-sm text-muted-foreground">{circle.books.author}</p>
            </div>
          )}

          {circle.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{circle.description}</p>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>
                  {circle.participant_count}/{circle.max_participants}
                </span>
              </div>
              {circle.start_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(circle.start_date), 'M/d', { locale: ja })}〜</span>
                </div>
              )}
            </div>
            {circle.users && <span className="text-xs">主催: {circle.users.display_name}</span>}
          </div>

          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            作成: {format(new Date(circle.created_at), 'yyyy/M/d', { locale: ja })}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
