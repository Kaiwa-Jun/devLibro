'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

import ReviewItem from '@/components/book/ReviewItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockReviews } from '@/lib/mock-data';
import { Review } from '@/types';

type ReviewListProps = {
  bookId: string;
};

export default function ReviewList({ bookId }: ReviewListProps) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // 実際の実装ではここでAPI呼び出し
    const timer = setTimeout(() => {
      setReviews(mockReviews);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [bookId]);

  const beginnerReviews = reviews.filter(r => r.experience_years < 3);
  const intermediateReviews = reviews.filter(
    r => r.experience_years >= 3 && r.experience_years < 5
  );
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
                reviews.map(review => <ReviewItem key={review.id} review={review} />)
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
                beginnerReviews.map(review => <ReviewItem key={review.id} review={review} />)
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
                intermediateReviews.map(review => <ReviewItem key={review.id} review={review} />)
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
                expertReviews.map(review => <ReviewItem key={review.id} review={review} />)
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
