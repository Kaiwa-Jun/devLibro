'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import RecommendationCard from '@/components/recommendations/RecommendationCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExperienceLevel, RecommendationWithBook } from '@/types';

interface RecommendationSectionProps {
  maxItems?: number;
}

interface RecommendationResponse {
  recommendations: RecommendationWithBook[];
  userExperienceLevel: ExperienceLevel;
  totalBooks: number;
  excludedBooks?: {
    reviewedCount: number;
    bookshelfCount: number;
  };
}

export interface RecommendationSectionRef {
  refreshRecommendations: () => void;
}

const RecommendationSection = forwardRef<RecommendationSectionRef, RecommendationSectionProps>(
  ({ maxItems = 6 }, ref) => {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState<RecommendationWithBook[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchRecommendationsRef = useRef<() => void>(() => {});
    const userRef = useRef(user);

    // userRefを最新の値で更新
    useEffect(() => {
      userRef.current = user;
    }, [user]);

    const fetchRecommendations = useCallback(async () => {
      if (!user) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = `/api/recommendations?userId=${user.id}&limit=${maxItems}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('レコメンドの取得に失敗しました');
        }

        const data: RecommendationResponse = await response.json();

        setRecommendations(data.recommendations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    }, [user, maxItems]);

    // fetchRecommendationsRefを最新の関数で更新
    useEffect(() => {
      fetchRecommendationsRef.current = fetchRecommendations;
    }, [fetchRecommendations]);

    // 外部から呼び出し可能な関数を公開
    useImperativeHandle(ref, () => ({
      refreshRecommendations: fetchRecommendations,
    }));

    useEffect(() => {
      if (user) {
        fetchRecommendations();
      }
    }, [user, fetchRecommendations]);

    // 本棚の変更を監視してレコメンドを更新
    useEffect(() => {
      const handleBookshelfUpdate = (event: CustomEvent) => {
        console.log('📚 本棚更新イベント受信:', event.detail);
        if (userRef.current) {
          console.log('🔄 レコメンド再取得開始');
          fetchRecommendationsRef.current();
        }
      };

      console.log('👂 本棚更新イベントリスナー登録');
      window.addEventListener('bookshelfUpdated', handleBookshelfUpdate as EventListener);

      return () => {
        console.log('🗑️ 本棚更新イベントリスナー削除');
        window.removeEventListener('bookshelfUpdated', handleBookshelfUpdate as EventListener);
      };
    }, []); // 依存配列を空にして、マウント時のみ実行

    // ログインしていない場合は表示しない
    if (!user) {
      return null;
    }

    // エラーの場合は表示しない
    if (error) {
      return null;
    }

    // ローディング中の表示
    if (loading) {
      return (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              あなたにおすすめ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-80">
                  <Skeleton className="h-48 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    // レコメンドがない場合は表示しない
    if (recommendations.length === 0) {
      return null;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                あなたにおすすめ
              </CardTitle>
              {recommendations.length >= maxItems && (
                <Link href="/recommendations">
                  <Button variant="ghost" size="sm" className="text-sm">
                    もっと見る
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {recommendations.map((recommendation, index) => (
                <RecommendationCard
                  key={recommendation.book.id}
                  recommendation={recommendation}
                  index={index}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

RecommendationSection.displayName = 'RecommendationSection';

export default RecommendationSection;
