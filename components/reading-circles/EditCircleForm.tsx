'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import { Book, ReadingCircle } from '@/types';

const editCircleSchema = z.object({
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
});

type EditCircleForm = z.infer<typeof editCircleSchema>;

interface EditCircleFormProps {
  circle: ReadingCircle & {
    books?: {
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
    };
  };
  onSuccess?: (circleId: string) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export function EditCircleForm({ circle, onSuccess, onCancel, isModal }: EditCircleFormProps) {
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
  const [initialBookId, setInitialBookId] = useState<string>('');

  const form = useForm<EditCircleForm>({
    resolver: zodResolver(editCircleSchema),
    defaultValues: {
      title: circle.title,
      description: circle.description || '',
      book_id: circle.book_id.toString(),
      max_participants: circle.max_participants,
      is_private: circle.is_private,
      start_date: circle.start_date ? new Date(circle.start_date).toISOString().split('T')[0] : '',
      end_date: circle.end_date ? new Date(circle.end_date).toISOString().split('T')[0] : '',
    },
  });

  // 初期書籍データの設定
  useEffect(() => {
    if (circle.books) {
      const bookData = {
        id: circle.books.id,
        title: circle.books.title,
        author: circle.books.author,
        img_url: circle.books.img_url,
        isbn: circle.books.isbn,
        language: circle.books.language,
        categories: circle.books.categories,
        description: circle.books.description,
        avg_difficulty: circle.books.avg_difficulty,
        programmingLanguages: circle.books.programmingLanguages,
        frameworks: circle.books.frameworks,
      };
      setSelectedBook(bookData);
      setInitialBookId(circle.books.id);
    }
  }, [circle.books]);

  // フォームの変更状態を監視
  const watchedValues = form.watch();
  const { isDirty } = form.formState;

  // 書籍の変更も含めて変更状態を判定
  const hasChanges = isDirty || selectedBook?.id !== initialBookId;

  const onSubmit = async (data: EditCircleForm) => {
    console.log('🚀 [EditCircleForm] フォーム送信開始');
    console.log('📝 [EditCircleForm] フォームデータ:', data);
    console.log('📚 [EditCircleForm] 選択された書籍:', selectedBook);

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

      console.log('📤 [EditCircleForm] 送信データ:', JSON.stringify(requestData, null, 2));

      // 認証トークンを取得
      const { supabase } = await import('@/lib/supabase/client');
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await fetch(`/api/reading-circles/${circle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: '輪読会の更新に失敗しました' };
        }
        throw new Error(errorData.error || '輪読会の更新に失敗しました');
      }

      const result = await response.json();
      console.log('✅ [EditCircleForm] 成功レスポンス:', result);

      if (onSuccess) {
        onSuccess(circle.id);
      } else {
        router.push(`/reading-circles/${circle.id}`);
      }
    } catch (error) {
      console.error('❌ [EditCircleForm] エラー発生:', error);
      toast.error(error instanceof Error ? error.message : '輪読会の更新に失敗しました');
    } finally {
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
    <>
      {isModal ? (
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
                    value={field.value?.toString()}
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
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                  } else {
                    router.back();
                  }
                }}
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="flex-1"
                variant={hasChanges ? 'default' : 'secondary'}
                disabled={isLoading || !selectedBook || !hasChanges}
              >
                {isLoading ? '更新中...' : hasChanges ? '輪読会を更新' : '変更なし'}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>輪読会を編集</CardTitle>
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
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.book_id.message}
                    </p>
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
                        value={field.value?.toString()}
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
                    onClick={() => {
                      if (onCancel) {
                        onCancel();
                      } else {
                        router.back();
                      }
                    }}
                    disabled={isLoading}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    variant={hasChanges ? 'default' : 'secondary'}
                    disabled={isLoading || !selectedBook || !hasChanges}
                  >
                    {isLoading ? '更新中...' : hasChanges ? '輪読会を更新' : '変更なし'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <BookSearchModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSelect={handleBookSelect}
      />
    </>
  );
}
