'use client';

import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReadingCircle } from '@/types';

import { ReadingCircleCard } from './ReadingCircleCard';

interface ReadingCircleListProps {
  userId?: string;
}

export function ReadingCircleList({ userId }: ReadingCircleListProps) {
  const [circles, setCircles] = useState<
    (ReadingCircle & {
      books?: {
        id: string;
        title: string;
        author: string;
        img_url: string;
      };
      users?: {
        id: string;
        display_name: string;
      };
    })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchCircles();
  }, [statusFilter]);

  const fetchCircles = async () => {
    try {
      setLoading(true);
      const filters: {
        status?: string;
      } = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      // Use direct client call instead of API endpoint
      const { getReadingCirclesClient } = await import('@/lib/supabase/reading-circles-client');
      const data = await getReadingCirclesClient(filters);
      setCircles(data || []);
    } catch (error) {
      handleError(error as Error);
      setCircles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: Error) => {
    console.error('Error fetching circles:', error);
  };

  const filteredCircles = circles.filter(circle => {
    const matchesSearch =
      !searchQuery ||
      circle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (circle.books?.title && circle.books.title.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === 'all') return matchesSearch;

    if (activeTab === 'organizing') {
      return matchesSearch && circle.created_by === userId;
    }

    if (activeTab === 'participating') {
      return matchesSearch && circle.created_by !== userId;
    }

    return matchesSearch;
  });

  const organizingCircles = circles.filter(circle => circle.created_by === userId);
  const participatingCircles = circles.filter(circle => circle.created_by !== userId);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="輪読会や書籍名で検索..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              <SelectItem value="recruiting">募集中</SelectItem>
              <SelectItem value="active">開催中</SelectItem>
              <SelectItem value="completed">終了</SelectItem>
            </SelectContent>
          </Select>

          <Button asChild>
            <Link href="/reading-circles/create">
              <Plus className="w-4 h-4 mr-2" />
              輪読会を作成
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">すべて ({circles.length})</TabsTrigger>
          <TabsTrigger value="organizing">主催中 ({organizingCircles.length})</TabsTrigger>
          <TabsTrigger value="participating">参加中 ({participatingCircles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {filteredCircles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? '条件に一致する輪読会が見つかりませんでした'
                  : 'まだ輪読会がありません'}
              </div>
              {!searchQuery && statusFilter === 'all' && (
                <Button asChild>
                  <Link href="/reading-circles/create">最初の輪読会を作成する</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCircles.map(circle => (
                <ReadingCircleCard
                  key={circle.id}
                  circle={circle}
                  isOrganizer={circle.created_by === userId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="organizing" className="mt-6">
          {filteredCircles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchQuery
                  ? '条件に一致する主催中の輪読会が見つかりませんでした'
                  : 'まだ主催している輪読会がありません'}
              </div>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/reading-circles/create">輪読会を作成する</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCircles.map(circle => (
                <ReadingCircleCard key={circle.id} circle={circle} isOrganizer={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="participating" className="mt-6">
          {filteredCircles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchQuery
                  ? '条件に一致する参加中の輪読会が見つかりませんでした'
                  : 'まだ参加している輪読会がありません'}
              </div>
              {!searchQuery && (
                <div className="text-sm text-muted-foreground">
                  気になる輪読会を見つけて参加してみましょう
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCircles.map(circle => (
                <ReadingCircleCard key={circle.id} circle={circle} isOrganizer={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
