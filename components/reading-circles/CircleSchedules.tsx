'use client';

import { useEffect, useState } from 'react';
import { getCircleSchedules, createCircleSchedule } from '@/lib/supabase/reading-circles';
import { CircleSchedule } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface CircleSchedulesProps {
  circleId: string;
  isHost?: boolean;
}

const scheduleFormSchema = z.object({
  title: z.string().min(3, {
    message: 'タイトルは3文字以上で入力してください',
  }).max(100, {
    message: 'タイトルは100文字以内で入力してください',
  }),
  description: z.string().max(500, {
    message: '説明は500文字以内で入力してください',
  }).optional(),
  scheduled_date: z.string({
    required_error: '日付を選択してください',
  }),
  start_page: z.number().min(1, {
    message: '開始ページは1以上で入力してください',
  }).optional(),
  end_page: z.number().min(1, {
    message: '終了ページは1以上で入力してください',
  }).optional(),
  is_ai_generated: z.boolean().default(false),
});

export default function CircleSchedules({ circleId, isHost = false }: CircleSchedulesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<CircleSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: '',
      description: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      start_page: 1,
      end_page: undefined,
      is_ai_generated: false,
    },
  });

  useEffect(() => {
    const fetchSchedules = async () => {
      setIsLoading(true);
      const scheduleData = await getCircleSchedules(circleId);
      
      scheduleData.sort((a, b) => 
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      );
      
      setSchedules(scheduleData);
      setIsLoading(false);
    };
    
    fetchSchedules();
  }, [circleId]);

  const onSubmit = async (values: z.infer<typeof scheduleFormSchema>) => {
    if (!user) {
      toast({
        title: 'エラー',
        description: 'ログインが必要です',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const scheduleData = {
        ...values,
        circle_id: circleId,
      };
      
      const result = await createCircleSchedule(scheduleData);
      
      if (result) {
        toast({
          title: 'スケジュールを作成しました',
        });
        
        setSchedules(prev => [...prev, result].sort((a, b) => 
          new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        ));
        
        form.reset();
        setIsDialogOpen(false);
      } else {
        toast({
          title: 'エラー',
          description: 'スケジュールの作成に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('スケジュール作成エラー:', error);
      toast({
        title: 'エラー',
        description: 'スケジュールの作成中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAISchedule = () => {
    toast({
      title: '機能準備中',
      description: 'AIによるスケジュール生成機能は現在開発中です',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">読書スケジュール</h2>
        {isHost && (
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <Plus size={16} />
                  <span>スケジュール追加</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新しいスケジュールを作成</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>タイトル</FormLabel>
                          <FormControl>
                            <Input placeholder="例: 第1章 読書会" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="scheduled_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>日付</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name="start_page"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>開始ページ</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="end_page"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>終了ページ</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>説明</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="このセッションの目標や議論したいポイントなど"
                              className="resize-none min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        キャンセル
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? '作成中...' : '作成'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-1"
              onClick={generateAISchedule}
            >
              AIで生成
            </Button>
          </div>
        )}
      </div>
      
      {schedules.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">スケジュールはまだありません</p>
          {isHost && (
            <p className="text-sm mt-2">
              「スケジュール追加」ボタンから新しいスケジュールを作成できます
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{schedule.title}</CardTitle>
                  {schedule.is_ai_generated && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      AI生成
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDate(schedule.scheduled_date)}</span>
                </div>
              </CardHeader>
              <CardContent>
                {schedule.start_page && schedule.end_page && (
                  <p className="text-sm mb-2">
                    読書範囲: {schedule.start_page}ページ 〜 {schedule.end_page}ページ
                  </p>
                )}
                <p className="text-sm whitespace-pre-line">
                  {schedule.description || '説明はありません'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
