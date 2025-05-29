'use client';

import { useEffect, useState } from 'react';
import { getUserCircleProgress, updateCircleProgress } from '@/lib/supabase/reading-circles';
import { CircleProgress as CircleProgressType, CircleSchedule } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { getCircleSchedules } from '@/lib/supabase/reading-circles';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CircleProgressProps {
  circleId: string;
  isHost?: boolean;
}

export default function CircleProgress({ circleId, isHost = false }: CircleProgressProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState<CircleProgressType | null>(null);
  const [schedules, setSchedules] = useState<CircleSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        const schedulesData = await getCircleSchedules(circleId);
        setSchedules(schedulesData);
        
        if (schedulesData.length > 0) {
          const maxEndPage = Math.max(...schedulesData
            .filter(s => s.end_page !== undefined)
            .map(s => s.end_page || 0));
          setTotalPages(maxEndPage);
        }
        
        const progressData = await getUserCircleProgress(circleId, user.id);
        setProgress(progressData);
        
        if (progressData) {
          setCurrentPage(progressData.current_page);
          setNotes(progressData.notes || '');
        }
      } catch (error) {
        console.error('進捗データ取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [circleId, user]);

  const handleUpdateProgress = async () => {
    if (!user) {
      toast({
        title: 'エラー',
        description: 'ログインが必要です',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const progressData = {
        circle_id: circleId,
        user_id: user.id,
        current_page: currentPage,
        notes: notes,
        is_completed: currentPage !== undefined && totalPages > 0 ? currentPage >= totalPages : false,
      };
      
      const result = await updateCircleProgress(progressData);
      
      if (result) {
        setProgress(result);
        toast({
          title: '進捗を更新しました',
        });
        setIsDialogOpen(false);
      } else {
        toast({
          title: 'エラー',
          description: '進捗の更新に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('進捗更新エラー:', error);
      toast({
        title: 'エラー',
        description: '進捗の更新中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateProgressPercentage = () => {
    if (!progress || !progress.current_page || totalPages === 0) return 0;
    return Math.min(Math.round((progress.current_page / totalPages) * 100), 100);
  };

  const getNextSchedule = () => {
    if (!progress || !progress.current_page || schedules.length === 0) return null;
    
    return schedules
      .filter(s => s.start_page !== undefined && s.start_page > (progress.current_page || 0))
      .sort((a, b) => (a.start_page || 0) - (b.start_page || 0))[0];
  };

  const getCurrentSchedule = () => {
    if (!progress || !progress.current_page || schedules.length === 0) return null;
    
    return schedules
      .filter(s => 
        s.start_page !== undefined && 
        s.end_page !== undefined && 
        s.start_page <= (progress.current_page || 0) && 
        s.end_page >= (progress.current_page || 0)
      )[0];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-1/3 mb-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>読書の進捗状況</CardTitle>
        </CardHeader>
        <CardContent>
          {!progress ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">まだ進捗データがありません</p>
              {user && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  進捗を記録する
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">
                    {progress.current_page || 0} / {totalPages} ページ
                  </span>
                  <span className="text-sm font-medium">
                    {calculateProgressPercentage()}%
                  </span>
                </div>
                <Progress value={calculateProgressPercentage()} className="h-2" />
              </div>
              
              {getCurrentSchedule() && (
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm font-medium mb-1">現在のセクション:</p>
                  <p className="text-sm">{getCurrentSchedule()?.title}</p>
                </div>
              )}
              
              {getNextSchedule() && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">次のセクション:</p>
                  <p className="text-sm">{getNextSchedule()?.title}</p>
                </div>
              )}
              
              {progress.notes && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-1">メモ:</p>
                  <p className="text-sm whitespace-pre-line">{progress.notes}</p>
                </div>
              )}
              
              <div className="flex justify-end mt-4">
                <Button onClick={() => setIsDialogOpen(true)}>
                  進捗を更新
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>読書の進捗を記録</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="current-page">現在のページ</Label>
              <Input
                id="current-page"
                type="number"
                min={1}
                max={totalPages > 0 ? totalPages : undefined}
                value={currentPage || ''}
                onChange={(e) => setCurrentPage(parseInt(e.target.value) || undefined)}
              />
              {totalPages > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  全{totalPages}ページ中
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="notes">メモ（気づきや質問など）</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
                placeholder="読書中の気づきや質問、議論したいポイントなどを記録しましょう"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button 
                onClick={handleUpdateProgress}
                disabled={isUpdating}
              >
                {isUpdating ? '更新中...' : '保存'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
