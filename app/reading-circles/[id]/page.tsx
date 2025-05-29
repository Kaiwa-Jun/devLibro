'use client';

import { ArrowLeft, Calendar, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import CircleChat from '@/components/reading-circles/CircleChat';
import CircleParticipants from '@/components/reading-circles/CircleParticipants';
import CircleProgress from '@/components/reading-circles/CircleProgress';
import CircleSchedules from '@/components/reading-circles/CircleSchedules';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { getReadingCircle, joinReadingCircle } from '@/lib/supabase/reading-circles';
import { formatDate } from '@/lib/utils';
import { ReadingCircle } from '@/types';

export default function ReadingCircleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [circle, setCircle] = useState<ReadingCircle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const fetchCircle = async () => {
      if (!params.id) return;

      setIsLoading(true);
      const circleData = await getReadingCircle(params.id as string);
      setCircle(circleData);

      if (user && circleData) {
        setIsHost(user.id === circleData.created_by);
        setIsParticipant(false); // 仮の実装
      }

      setIsLoading(false);
    };

    fetchCircle();
  }, [params.id, user]);

  const handleJoin = async () => {
    if (!user) {
      toast({
        title: 'エラー',
        description: 'ログインが必要です',
        variant: 'destructive',
      });
      return;
    }

    if (!circle) return;

    setIsJoining(true);

    try {
      const result = await joinReadingCircle(circle.id, user.id);

      if (result) {
        toast({
          title: '参加リクエストを送信しました',
          description: 'ホストの承認をお待ちください',
        });
        setIsParticipant(true);
      } else {
        toast({
          title: 'エラー',
          description: '参加リクエストの送信に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('参加エラー:', error);
      toast({
        title: 'エラー',
        description: '参加処理中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
          >
            計画中
          </Badge>
        );
      case 'active':
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          >
            進行中
          </Badge>
        );
      case 'completed':
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
          >
            完了
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
          >
            中止
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-20 w-full mb-4" />
        </div>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">輪読会が見つかりませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        戻る
      </Button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">{circle.title}</h1>
          {getStatusBadge(circle.status)}
        </div>

        <div className="text-muted-foreground mb-4">
          <p>書籍: {circle.book?.title || '書籍情報なし'}</p>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>{circle.participant_count || 0}人参加</span>
            </div>
            {circle.start_date && (
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{formatDate(circle.start_date)} 開始</span>
              </div>
            )}
          </div>
        </div>

        <p className="mb-6">{circle.description || '説明はありません'}</p>

        {user && !isHost && !isParticipant && (
          <Button onClick={handleJoin} disabled={isJoining} className="mb-6">
            {isJoining ? '処理中...' : '参加リクエストを送信'}
          </Button>
        )}
      </div>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="schedule">スケジュール</TabsTrigger>
          <TabsTrigger value="participants">参加者</TabsTrigger>
          <TabsTrigger value="progress">進捗</TabsTrigger>
          <TabsTrigger value="chat">チャット</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <CircleSchedules circleId={circle.id} isHost={isHost} />
        </TabsContent>

        <TabsContent value="participants">
          <CircleParticipants circleId={circle.id} isHost={isHost} />
        </TabsContent>

        <TabsContent value="progress">
          <CircleProgress circleId={circle.id} isHost={isHost} />
        </TabsContent>

        <TabsContent value="chat">
          <CircleChat circleId={circle.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
