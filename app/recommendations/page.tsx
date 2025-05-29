'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import RecommendationCard from '@/components/recommendations/RecommendationCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RecommendationWithBook } from '@/types';

export default function RecommendationsPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const userRef = useRef(user);
  const fetchRecommendationsRef = useRef<(pageNum?: number, append?: boolean) => void>(() => {});

  // userRefを最新の値で更新
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchRecommendations = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!user?.id) return;

      try {
        if (pageNum === 1) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const limit = 12; // ページあたりの表示数
        const response = await fetch(
          `/api/recommendations?userId=${user.id}&limit=${limit}&offset=${(pageNum - 1) * limit}`
        );

        if (!response.ok) {
          throw new Error('レコメンドの取得に失敗しました');
        }

        const data = await response.json();

        if (append) {
          setRecommendations(prev => [...prev, ...data.recommendations]);
        } else {
          setRecommendations(data.recommendations);
        }

        setHasMore(data.recommendations.length === limit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user?.id]
  );

  // fetchRecommendationsRefを最新の関数で更新
  useEffect(() => {
    fetchRecommendationsRef.current = fetchRecommendations;
  }, [fetchRecommendations]);

  useEffect(() => {
    fetchRecommendations(1, false);
  }, [fetchRecommendations]);

  // 本棚の変更を監視してレコメンドを更新
  useEffect(() => {
    const handleBookshelfUpdate = () => {
      if (userRef.current?.id) {
        setPage(1);
        fetchRecommendationsRef.current(1, false);
      }
    };

    window.addEventListener('bookshelfUpdated', handleBookshelfUpdate);

    return () => {
      window.removeEventListener('bookshelfUpdated', handleBookshelfUpdate);
    };
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecommendations(nextPage, true);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">ログインしてレコメンドを表示してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📚 あなたへのおすすめ</h1>
        <p className="text-muted-foreground">
          あなたの経験年数とレビューデータに基づいて、最適な書籍をおすすめします
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchRecommendations(1, false)} variant="outline">
            再試行
          </Button>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">現在おすすめできる書籍がありません</p>
          <p className="text-sm text-muted-foreground">
            書籍にレビューを投稿すると、より良いレコメンドを提供できます
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((recommendation, index) => (
              <div key={recommendation.book.id} className="w-full">
                <RecommendationCard recommendation={recommendation} index={index} />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8">
              <Button onClick={handleLoadMore} disabled={loadingMore} variant="outline" size="lg">
                {loadingMore ? 'ロード中...' : 'さらに読み込む'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
