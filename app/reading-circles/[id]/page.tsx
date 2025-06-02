'use client';

import { useEffect, useState } from 'react';

import AuthButton from '@/components/auth/AuthButton';
import { useAuth } from '@/components/auth/AuthProvider';
import { ReadingCircleDetail } from '@/components/reading-circles/ReadingCircleDetail';
import { Skeleton } from '@/components/ui/skeleton';
import { getReadingCircleByIdClient } from '@/lib/supabase/reading-circles-client';
import { ReadingCircle } from '@/types';

interface ReadingCirclePageProps {
  params: {
    id: string;
  };
}

export default function ReadingCirclePage({ params }: ReadingCirclePageProps) {
  const { user, loading } = useAuth();
  const [circle, setCircle] = useState<
    | (ReadingCircle & {
        books?: {
          id: string;
          title: string;
          author: string;
          img_url: string;
        };
      })
    | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCircle = async () => {
      try {
        setIsLoading(true);
        const circleData = await getReadingCircleByIdClient(params.id);
        setCircle(circleData);
      } catch (err) {
        console.error('Error fetching reading circle:', err);
        setError('輪読会の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCircle();
  }, [params.id]);

  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">ログインが必要です</h1>
          <p className="text-muted-foreground mb-6">
            輪読会の詳細を表示するには、ログインが必要です。
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">輪読会が見つかりません</h1>
          <p className="text-muted-foreground">
            指定された輪読会は存在しないか、削除された可能性があります。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <ReadingCircleDetail circle={circle} userId={user.id} />
      </div>
    </div>
  );
}
