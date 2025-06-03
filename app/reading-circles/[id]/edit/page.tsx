'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import AuthButton from '@/components/auth/AuthButton';
import { useAuth } from '@/components/auth/AuthProvider';
import { EditCircleForm } from '@/components/reading-circles/EditCircleForm';
import { Skeleton } from '@/components/ui/skeleton';
import { ReadingCircle } from '@/types';

export default function EditReadingCirclePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [circle, setCircle] = useState<
    | (ReadingCircle & {
        books?: {
          id: string;
          title: string;
          author: string;
          img_url: string;
          isbn?: string;
          language?: string;
          categories?: string[];
          description?: string;
          avg_difficulty?: number;
          programmingLanguages?: string[];
          frameworks?: string[];
        };
      })
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const circleId = params.id as string;

  useEffect(() => {
    const fetchCircle = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // 認証トークンを取得
        const { supabase } = await import('@/lib/supabase/client');
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        const response = await fetch(`/api/reading-circles/${circleId}`, {
          headers: {
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('輪読会が見つかりません');
          }
          throw new Error('輪読会の取得に失敗しました');
        }

        const result = await response.json();
        setCircle(result.data);

        // 主催者でない場合はアクセス拒否
        if (result.data.created_by !== user.id) {
          toast.error('この輪読会を編集する権限がありません');
          router.push(`/reading-circles/${circleId}`);
          return;
        }
      } catch (error) {
        console.error('Error fetching circle:', error);
        setError(error instanceof Error ? error.message : '輪読会の取得に失敗しました');
        toast.error(error instanceof Error ? error.message : '輪読会の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchCircle();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, circleId, router]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="space-y-6">
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">輪読会を編集</h1>
            <p className="text-muted-foreground">輪読会を編集するには、ログインが必要です。</p>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">ログインしてください。</p>
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">輪読会が見つかりません</p>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">輪読会を編集</h1>
          <p className="text-muted-foreground">輪読会の情報を編集できます。</p>
        </div>

        <EditCircleForm circle={circle} />
      </div>
    </div>
  );
}
