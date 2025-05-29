'use client';

import { BookOpen, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';
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
  const [hasEligibleBooks, setHasEligibleBooks] = useState<boolean | null>(null); // null = 未確定
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
          setHasEligibleBooks(data.hasEligibleBooks); // 初回のみ設定
        }

        setHasMore(data.recommendations.length === limit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
        if (pageNum === 1) {
          setHasEligibleBooks(false); // エラー時は対象書籍なしとして扱う
        }
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
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="bg-muted p-4 rounded-full">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-medium mb-2">ログインが必要です</h2>
          <p className="text-muted-foreground mb-6">
            あなたに最適な書籍をおすすめするために、ログインしてください
          </p>
          <Link href="/auth/signin">
            <Button>ログイン</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 対象書籍がない場合は専用メッセージを表示
  if (!loading && hasEligibleBooks === false) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📚 あなたへのおすすめ</h1>
          <p className="text-muted-foreground">
            あなたの経験年数とレビューデータに基づいて、最適な書籍をおすすめします
          </p>
        </div>
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="bg-muted p-4 rounded-full">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-medium mb-2">おすすめできる書籍がありません</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            現在、レビューデータが蓄積されている書籍がないため、おすすめを表示できません。
            <br />
            今後、書籍のレビューが投稿されると、おすすめ機能をご利用いただけます。
          </p>
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
          <div className="flex justify-center mb-4">
            <div className="bg-red-50 p-4 rounded-full">
              <BookOpen className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-xl font-medium mb-2">エラーが発生しました</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <Button onClick={() => fetchRecommendations(1, false)} variant="outline">
            再試行
          </Button>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="bg-muted p-4 rounded-full">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-medium mb-2">おすすめ書籍を準備中です</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            本棚に書籍を追加したり、レビューを書くことで、より精度の高いおすすめを提供できます。
          </p>
          <div className="flex justify-center">
            <Link href="/profile">
              <Button variant="outline">
                <Heart className="h-4 w-4 mr-2" />
                本棚を設定
              </Button>
            </Link>
          </div>
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
