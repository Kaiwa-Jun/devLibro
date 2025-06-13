'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReadingCircle, getCircleStatus } from '@/types';

import { MyReadingGroupsCard } from './MyReadingGroupsCard';
import { NextEventCard } from './NextEventCard';

interface ReadingCircleHomeProps {
  userId: string;
}

type ExtendedReadingCircle = ReadingCircle & {
  books?: {
    id: string;
    title: string;
    author: string;
    img_url: string;
  };
  currentProgress?: number;
  totalPages?: number;
};

export function ReadingCircleHome({ userId }: ReadingCircleHomeProps) {
  const [circles, setCircles] = useState<ExtendedReadingCircle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCircles();
  }, [userId]);

  const fetchCircles = async () => {
    try {
      setLoading(true);
      const { getReadingCirclesClient } = await import('@/lib/supabase/reading-circles-client');
      const data = await getReadingCirclesClient();

      // モックデータで進捗情報を追加
      const circlesWithProgress = (data || []).map(
        (
          circle: ReadingCircle & {
            books?: {
              id: string;
              title: string;
              author: string;
              img_url: string;
            };
          }
        ) => ({
          ...circle,
          currentProgress: Math.floor(Math.random() * 100),
          totalPages: 200 + Math.floor(Math.random() * 300),
        })
      );

      setCircles(circlesWithProgress);
    } catch (error) {
      console.error('Error fetching circles:', error);
      setCircles([]);
    } finally {
      setLoading(false);
    }
  };

  // 自分が参加している輪読会を抽出
  const myCircles = circles.filter(
    circle =>
      circle.created_by === userId ||
      // TODO: 実際の参加者情報を取得して判定
      true
  );

  // ステータス別に分類
  const inProgressCircles = myCircles.filter(circle => getCircleStatus(circle) === 'active');
  const recruitingCircles = myCircles.filter(circle => getCircleStatus(circle) === 'recruiting');
  const completedCircles = myCircles.filter(circle => getCircleStatus(circle) === 'completed');

  // 次の予定を取得（開始日が最も近い開催中または募集中の輪読会）
  const nextEvent = myCircles
    .filter(circle => {
      const status = getCircleStatus(circle);
      return (status === 'active' || status === 'recruiting') && circle.start_date;
    })
    .sort((a, b) => {
      if (!a.start_date || !b.start_date) return 0;
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    })[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 次の予定 */}
      <NextEventCard event={nextEvent} />

      {/* 新規作成ボタン */}
      <div className="flex justify-center">
        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Link href="/reading-circles/create">
            <Plus className="w-5 h-5 mr-2" />
            新しい輪読会を作成
          </Link>
        </Button>
      </div>

      {/* 私の輪読会 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">私の輪読会</h2>

        {/* 開催中 */}
        <section>
          <h3 className="text-lg font-semibold mb-4 text-green-700">
            開催中 ({inProgressCircles.length})
          </h3>
          {inProgressCircles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">開催中の輪読会はありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressCircles.map(circle => (
                <MyReadingGroupsCard key={circle.id} circle={circle} />
              ))}
            </div>
          )}
        </section>

        {/* 募集中 */}
        <section>
          <h3 className="text-lg font-semibold mb-4 text-blue-700">
            募集中 ({recruitingCircles.length})
          </h3>
          {recruitingCircles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">募集中の輪読会はありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recruitingCircles.map(circle => (
                <MyReadingGroupsCard key={circle.id} circle={circle} />
              ))}
            </div>
          )}
        </section>

        {/* 完了 */}
        <section>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            完了 ({completedCircles.length})
          </h3>
          {completedCircles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">完了した輪読会はありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedCircles.map(circle => (
                <MyReadingGroupsCard key={circle.id} circle={circle} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
