'use client';

import { useEffect, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReadingCircle } from '@/types';
import { getUserReadingCircles, searchPublicReadingCircles } from '@/lib/supabase/reading-circles';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function ReadingCirclesPage() {
  const { user } = useAuth();
  const [hostingCircles, setHostingCircles] = useState<ReadingCircle[]>([]);
  const [participatingCircles, setParticipatingCircles] = useState<ReadingCircle[]>([]);
  const [publicCircles, setPublicCircles] = useState<ReadingCircle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCircles = async () => {
      setIsLoading(true);
      
      if (user) {
        const hosting = await getUserReadingCircles(user.id, 'host');
        setHostingCircles(hosting);
        
        const participating = await getUserReadingCircles(user.id, 'participant');
        setParticipatingCircles(participating);
      }
      
      const public_circles = await searchPublicReadingCircles();
      setPublicCircles(public_circles);
      
      setIsLoading(false);
    };
    
    fetchCircles();
  }, [user]);

  const renderCircleCard = (circle: ReadingCircle) => {
    return (
      <Link href={`/reading-circles/${circle.id}`} key={circle.id}>
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow h-full">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium">{circle.title}</h3>
            <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {circle.status === 'planning' && '計画中'}
              {circle.status === 'active' && '進行中'}
              {circle.status === 'completed' && '完了'}
              {circle.status === 'cancelled' && '中止'}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {circle.book?.title || '書籍情報なし'}
          </p>
          <p className="text-sm line-clamp-3 mb-4">
            {circle.description || '説明はありません'}
          </p>
          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>{circle.participant_count || 0}人参加</span>
            </div>
            {circle.start_date && (
              <div className="flex items-center gap-1">
                <span>{new Date(circle.start_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  };

  const renderSkeletons = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="border rounded-lg p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">輪読会</h1>
        {user && (
          <Link href="/reading-circles/create">
            <Button className="flex items-center gap-1">
              <Plus size={16} />
              <span>輪読会を作成</span>
            </Button>
          </Link>
        )}
      </div>
      
      <Tabs defaultValue="hosting" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="hosting">主催中</TabsTrigger>
          <TabsTrigger value="participating">参加中</TabsTrigger>
          <TabsTrigger value="all">すべて</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hosting">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderSkeletons()}
            </div>
          ) : hostingCircles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">主催している輪読会はありません。新しい輪読会を作成してみましょう！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hostingCircles.map(renderCircleCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="participating">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderSkeletons()}
            </div>
          ) : participatingCircles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">参加している輪読会はありません。興味のある輪読会に参加してみましょう！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participatingCircles.map(renderCircleCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderSkeletons()}
            </div>
          ) : publicCircles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">公開されている輪読会はありません。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicCircles.map(renderCircleCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
