'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Dynamic renderingを強制（ビルド時のstatic generationを回避）
export const dynamic = 'force-dynamic';

import ReadingCirclesHome from '@/components/reading-circles/ReadingCirclesHome';
import { getReadingCircles, type ReadingCircle } from '@/lib/supabase/reading-circles';

export default function ReadingCirclesPage() {
  const router = useRouter();
  const [circles, setCircles] = useState<ReadingCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCircles = async () => {
      try {
        setLoading(true);
        const data = await getReadingCircles();
        setCircles(data);
      } catch (err) {
        console.error('Error fetching reading circles:', err);
        setError('輪読会データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchCircles();
  }, []);

  // Supabaseデータを画面表示用の形式に変換
  const transformedCircles = circles.map(circle => {
    // より自然な日時を生成（現在から1週間後）
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMeetingDate =
      circle.status === 'in-progress'
        ? `${nextWeek.getFullYear()}/${(nextWeek.getMonth() + 1).toString().padStart(2, '0')}/${nextWeek.getDate().toString().padStart(2, '0')}`
        : undefined;

    return {
      id: circle.id,
      title: circle.title,
      bookTitle: circle.title, // book情報がない場合はタイトルを使用
      bookCover:
        'https://books.google.com/books/content?id=PXa2bby0oQ0C&printsec=frontcover&img=1&zoom=1&source=gbs_api', // デフォルト画像
      participants: circle.member_count || 1,
      maxParticipants: circle.max_participants || 10,
      progress: circle.progress || 0,
      status: circle.status,
      nextMeetingDate,
      description: circle.description || '',
      scheduleCandidates: circle.schedule_candidates || [],
    };
  });

  // 次回予定イベント（進行中の輪読会から最初の1つ）
  const inProgressCircle = transformedCircles.find(circle => circle.status === 'in-progress');
  const nextEvent = inProgressCircle
    ? {
        id: inProgressCircle.id,
        title: inProgressCircle.title,
        bookTitle: inProgressCircle.bookTitle,
        bookCover: inProgressCircle.bookCover,
        date: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate() + 7}日`,
        time: '19:00',
        participants: inProgressCircle.participants,
        maxParticipants: inProgressCircle.maxParticipants,
        progress: inProgressCircle.progress,
      }
    : undefined;

  const handleCreateCircle = () => {
    // TODO: 輪読会作成モーダルを開く、または作成ページに遷移
    router.push('/reading-circles/create');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-16 pb-16 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">輪読会データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-16 pb-16 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="text-primary hover:underline">
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 pb-16 md:pb-0">
      <ReadingCirclesHome
        nextEvent={nextEvent}
        myCircles={transformedCircles}
        onCreateCircle={handleCreateCircle}
      />
    </div>
  );
}
