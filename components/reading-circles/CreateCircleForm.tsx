'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useAuth } from '@/components/auth/AuthProvider';
import { BookSearchModal } from '@/components/modals/BookSearchModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Book } from '@/types';

const createCircleSchema = z
  .object({
    title: z
      .string()
      .min(1, '輪読会名は必須です')
      .max(255, '輪読会名は255文字以内で入力してください'),
    description: z.string().optional(),
    book_id: z.string().min(1, '書籍を選択してください'),
    max_participants: z
      .number()
      .int()
      .min(2, '最小2名以上設定してください')
      .max(50, '最大50名まで設定できます'),
    is_private: z.boolean(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  })
  .refine(
    data => {
      // 開始日と終了日の両方が設定されている場合のみチェック
      if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);

        // 日付が有効かチェック
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return false;
        }

        // 開始日が終了日より前であることをチェック
        return startDate <= endDate;
      }
      return true;
    },
    {
      message: '開始日は終了日より前の日付を設定してください',
      path: ['start_date'], // エラーをstart_dateフィールドに関連付け
    }
  );

type CreateCircleForm = z.infer<typeof createCircleSchema>;

interface CreateCircleFormProps {
  onSuccess?: (circleId: string) => void;
}

export function CreateCircleForm({ onSuccess }: CreateCircleFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<{
    id: string;
    title: string;
    author: string;
    img_url: string;
    isbn?: string;
    language?: string;
    categories?: string[];
    description?: string;
    avg_difficulty?: number;
    programmingLanguages?: string[];
    frameworks?: string[];
  } | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const form = useForm<CreateCircleForm>({
    resolver: zodResolver(createCircleSchema),
    defaultValues: {
      title: '',
      description: '',
      max_participants: 10,
      is_private: false,
    },
  });

  const onSubmit = async (data: CreateCircleForm) => {
    console.log('🚀 [CreateCircleForm] フォーム送信開始');
    console.log('📝 [CreateCircleForm] フォームデータ:', data);
    console.log('📚 [CreateCircleForm] 選択された書籍:', selectedBook);
    console.log('👤 [CreateCircleForm] 認証ユーザー:', user);

    // Supabaseクライアントの認証状態も確認
    const { supabase } = await import('@/lib/supabase/client');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 [CreateCircleForm] クライアントセッション:', {
      hasSession: !!sessionData.session,
      hasUser: !!sessionData.session?.user,
      sessionError: sessionError?.message,
      userId: sessionData.session?.user?.id,
      userEmail: sessionData.session?.user?.email,
    });

    setIsLoading(true);
    try {
      // 選択された書籍の詳細データを含めて送信
      const requestData = {
        ...data,
        book_data: selectedBook
          ? {
              id: selectedBook.id,
              title: selectedBook.title,
              author: selectedBook.author,
              img_url: selectedBook.img_url,
              isbn: selectedBook.isbn || '',
              language: selectedBook.language || 'ja',
              categories: selectedBook.categories || [],
              description: selectedBook.description || '',
              avg_difficulty: selectedBook.avg_difficulty || 0,
              programmingLanguages: selectedBook.programmingLanguages || [],
              frameworks: selectedBook.frameworks || [],
            }
          : undefined,
      };

      console.log('📤 [CreateCircleForm] 送信データ:', JSON.stringify(requestData, null, 2));

      console.log('🌐 [CreateCircleForm] API呼び出し開始');

      // 認証トークンを取得
      const accessToken = sessionData.session?.access_token;
      console.log('🎫 [CreateCircleForm] アクセストークン:', accessToken ? 'あり' : 'なし');

      const response = await fetch('/api/reading-circles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify(requestData),
      });

      console.log('📥 [CreateCircleForm] レスポンス受信:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        console.log('❌ [CreateCircleForm] レスポンスエラー、詳細取得中...');
        let errorData;
        try {
          errorData = await response.json();
          console.log('❌ [CreateCircleForm] エラーデータ:', errorData);
        } catch (parseError) {
          console.error('❌ [CreateCircleForm] エラーレスポンス解析失敗:', parseError);
          const responseText = await response.text();
          console.log('❌ [CreateCircleForm] レスポンステキスト:', responseText);
          errorData = { error: 'レスポンスの解析に失敗しました' };
        }
        throw new Error(errorData.error || '輪読会の作成に失敗しました');
      }

      console.log('✅ [CreateCircleForm] 成功レスポンス解析中...');
      const result = await response.json();
      console.log('✅ [CreateCircleForm] 成功レスポンス:', result);

      toast.success('輪読会を作成しました');

      if (onSuccess) {
        console.log('🎯 [CreateCircleForm] onSuccessコールバック実行');
        onSuccess(result.data.id);
      } else {
        console.log('🔄 [CreateCircleForm] ページリダイレクト実行');
        router.push(`/reading-circles/${result.data.id}`);
      }
    } catch (error) {
      console.error('❌ [CreateCircleForm] エラー発生:', error);
      console.error(
        '❌ [CreateCircleForm] エラースタック:',
        error instanceof Error ? error.stack : 'スタック情報なし'
      );
      toast.error(error instanceof Error ? error.message : '輪読会の作成に失敗しました');
    } finally {
      console.log('🏁 [CreateCircleForm] 処理完了');
      setIsLoading(false);
    }
  };

  const handleBookSelect = (book: Book) => {
    setSelectedBook({
      id: book.id,
      title: book.title,
      author: book.author,
      img_url: book.img_url,
      isbn: book.isbn,
      language: book.language,
      categories: book.categories,
      description: book.description,
      avg_difficulty: book.avg_difficulty,
      programmingLanguages: book.programmingLanguages,
      frameworks: book.frameworks,
    });
    form.setValue('book_id', book.id);
    setIsBookModalOpen(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>輪読会を作成</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>輪読会名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="例: React実践入門を読む会" {...field} />
                  </FormControl>
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
                      placeholder="輪読会の詳細、進め方、目標などを記入してください"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label className="text-sm font-medium">対象書籍 *</Label>
              {selectedBook ? (
                <Card className="mt-2">
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={selectedBook.img_url}
                      alt={selectedBook.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{selectedBook.title}</h4>
                      <p className="text-sm text-muted-foreground">{selectedBook.author}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsBookModalOpen(true)}
                    >
                      変更
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => setIsBookModalOpen(true)}
                >
                  書籍を選択
                </Button>
              )}
              {form.formState.errors.book_id && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.book_id.message}</p>
              )}
            </div>

            <FormField
              control={form.control}
              name="max_participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大参加者数</FormLabel>
                  <Select
                    onValueChange={value => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="参加者数を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 49 }, (_, i) => i + 2).map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}名
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>開始予定日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>終了予定日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_private"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">プライベート輪読会</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      プライベートに設定すると、招待された人のみが参加できます
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || !selectedBook}>
                {isLoading ? '作成中...' : '輪読会を作成'}
              </Button>
            </div>
          </form>
        </Form>

        <BookSearchModal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          onSelect={handleBookSelect}
        />
      </CardContent>
    </Card>
  );
}
