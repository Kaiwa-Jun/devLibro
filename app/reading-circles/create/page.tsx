'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { useAuth } from '@/components/auth/AuthProvider';
import BookSelector from '@/components/reading-circles/BookSelector';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createReadingCircle } from '@/lib/supabase/reading-circles';

const formSchema = z.object({
  title: z
    .string()
    .min(3, {
      message: 'タイトルは3文字以上で入力してください',
    })
    .max(100, {
      message: 'タイトルは100文字以内で入力してください',
    }),
  description: z
    .string()
    .max(500, {
      message: '説明は500文字以内で入力してください',
    })
    .optional(),
  book_id: z.string({
    required_error: '書籍を選択してください',
  }),
  max_participants: z
    .number()
    .min(2, {
      message: '最低2人以上の参加者が必要です',
    })
    .max(50, {
      message: '最大50人までの参加者に制限してください',
    }),
  is_private: z.boolean().default(false),
});

export default function CreateReadingCirclePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      max_participants: 10,
      is_private: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
      const circleData = {
        ...values,
        created_by: user.id,
        status: 'planning' as const,
      };

      const result = await createReadingCircle(circleData);

      if (result) {
        toast({
          title: '輪読会を作成しました',
          description: '新しい輪読会が正常に作成されました',
        });
        router.push(`/reading-circles/${result.id}`);
      } else {
        toast({
          title: 'エラー',
          description: '輪読会の作成に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('輪読会作成エラー:', error);
      toast({
        title: 'エラー',
        description: '輪読会の作成中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        戻る
      </Button>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">新しい輪読会を作成</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タイトル</FormLabel>
                  <FormControl>
                    <Input placeholder="輪読会のタイトル" {...field} />
                  </FormControl>
                  <FormDescription>
                    輪読会の目的や内容がわかるタイトルを入力してください
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="輪読会の説明、目標、対象者などを入力してください"
                      className="resize-none min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="book_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>書籍</FormLabel>
                  <FormControl>
                    <BookSelector value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>輪読会で使用する書籍を選択してください</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大参加人数</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={2}
                      max={50}
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_private"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>非公開設定</FormLabel>
                    <FormDescription>オンにすると招待された人だけが参加できます</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '作成中...' : '輪読会を作成'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
