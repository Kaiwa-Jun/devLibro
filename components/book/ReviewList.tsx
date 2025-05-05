'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

import ReviewItem from '@/components/book/ReviewItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { REVIEW_ADDED, reviewEvents } from '@/lib/events/reviewEvents';
import { getBookReviews } from '@/lib/supabase/reviews';
import { Review } from '@/types';

type ReviewListProps = {
  bookId: string;
};

// 経験年数の表示用マッピング
const experienceLabels: Record<number, string> = {
  0: '未経験',
  0.5: '1年未満',
  2: '1〜3年',
  4: '3〜5年',
  5: '5年以上',
};

// 経験年数から表示テキストを取得する関数
const getExperienceLabel = (years: number): string => {
  return experienceLabels[years] || `${years}年`;
};

// データベースから返されるレビューデータの型
interface DatabaseReview {
  id?: string;
  user_id?: string;
  book_id?: string | number;
  difficulty?: number;
  comment?: string;
  experience_years?: number;
  created_at?: string;
  display_type?: string;
  custom_pen_name?: string;
  users?: {
    display_name?: string;
  } | null;
  [key: string]: unknown;
}

export default function ReviewList({ bookId }: ReviewListProps) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);

  // データ取得関数をuseCallbackでメモ化
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await getBookReviews(bookId);

      if (error || !data) {
        console.error('レビューの取得に失敗しました:', error);
        setReviews([]);
      } else {
        // データベースから返されたデータをReview型に変換
        const formattedReviews: Review[] = [];

        // 各レビューデータを処理して適切な形式に変換
        for (const item of data) {
          try {
            // 匿名投稿かどうか判定
            const isAnonymous = item.display_type === 'anon';

            // ユーザー名の取得（デフォルトは匿名）
            let userName = '匿名ユーザー';

            // 匿名でない場合のみ、ユーザー名を設定
            if (!isAnonymous) {
              // カスタム表示名がある場合それを使用
              if (item.display_type === 'custom' && item.custom_pen_name) {
                userName = String(item.custom_pen_name);
              } else {
                // users情報を使おうとしたが型の問題があるので、代わりに安全なアプローチを使用
                try {
                  // まずunknownとして扱い、必要なプロパティの存在を確認
                  const usersObj = item.users as unknown;
                  if (usersObj && typeof usersObj === 'object') {
                    const userObject = usersObj as { display_name?: unknown };
                    if ('display_name' in userObject && userObject.display_name) {
                      userName = String(userObject.display_name);
                    }
                  }
                } catch (e) {
                  // 何もしない - デフォルトのユーザー名を使用
                }
              }
            }

            // 安全にプロパティにアクセス
            const reviewItem: Review = {
              id: String(item.id || ''),
              user_id: String(item.user_id || ''),
              book_id: String(item.book_id || ''),
              difficulty: Number(item.difficulty || 0),
              experience_years: Number(item.experience_years || 0),
              comment: String(item.comment || ''),
              created_at: String(item.created_at || new Date().toISOString()),
              user_name: userName,
              anonymous: isAnonymous, // 匿名投稿かどうかのフラグを設定
            };

            formattedReviews.push(reviewItem);
          } catch (err) {
            console.error('レビューデータの変換エラー:', err);
            // エラーが発生しても処理を続行
          }
        }

        setReviews(formattedReviews);
      }
    } catch (err) {
      console.error('レビュー取得エラー:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  // 初回レンダリング時にデータを取得
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // レビュー追加イベントを購読
  useEffect(() => {
    // レビュー追加イベントのハンドラー
    const handleReviewAdded = (data?: unknown) => {
      // データがあり、bookIdが一致する場合のみデータを再取得
      const eventData = data as { bookId: string } | undefined;
      if (eventData && eventData.bookId === bookId) {
        fetchReviews();
      }
    };

    // イベントリスナーを登録
    const unsubscribe = reviewEvents.subscribe(REVIEW_ADDED, handleReviewAdded);

    // クリーンアップ関数でリスナーを解除
    return () => {
      unsubscribe();
    };
  }, [bookId, fetchReviews]);

  // 経験年数に基づいてレビューを分類
  const beginnerReviews = reviews.filter(
    r => r.experience_years < 3 || [0, 0.5, 2].includes(r.experience_years)
  );
  const intermediateReviews = reviews.filter(r => r.experience_years === 4);
  const expertReviews = reviews.filter(r => r.experience_years >= 5);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>レビュー</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-6" />
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>レビュー</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-background rounded-md border border-transparent data-[state=active]:border-border"
            >
              すべて ({reviews.length})
            </TabsTrigger>
            <TabsTrigger
              value="beginner"
              className="data-[state=active]:bg-background rounded-md border border-transparent data-[state=active]:border-border"
            >
              初級者 ({beginnerReviews.length})
            </TabsTrigger>
            <TabsTrigger
              value="intermediate"
              className="data-[state=active]:bg-background rounded-md border border-transparent data-[state=active]:border-border"
            >
              中級者 ({intermediateReviews.length})
            </TabsTrigger>
            <TabsTrigger
              value="expert"
              className="data-[state=active]:bg-background rounded-md border border-transparent data-[state=active]:border-border"
            >
              上級者 ({expertReviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <ReviewItem
                    key={review.id}
                    review={{
                      ...review,
                      // 数値から表示用テキストに変換
                      experienceLabel: getExperienceLabel(review.experience_years),
                    }}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  まだレビューがありません。最初のレビューを投稿しましょう！
                </p>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="beginner" className="mt-6">
            <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
              {beginnerReviews.length > 0 ? (
                beginnerReviews.map(review => (
                  <ReviewItem
                    key={review.id}
                    review={{
                      ...review,
                      experienceLabel: getExperienceLabel(review.experience_years),
                    }}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  初級者からのレビューはまだありません。
                </p>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="intermediate" className="mt-6">
            <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
              {intermediateReviews.length > 0 ? (
                intermediateReviews.map(review => (
                  <ReviewItem
                    key={review.id}
                    review={{
                      ...review,
                      experienceLabel: getExperienceLabel(review.experience_years),
                    }}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  中級者からのレビューはまだありません。
                </p>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="expert" className="mt-6">
            <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
              {expertReviews.length > 0 ? (
                expertReviews.map(review => (
                  <ReviewItem
                    key={review.id}
                    review={{
                      ...review,
                      experienceLabel: getExperienceLabel(review.experience_years),
                    }}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  上級者からのレビューはまだありません。
                </p>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
