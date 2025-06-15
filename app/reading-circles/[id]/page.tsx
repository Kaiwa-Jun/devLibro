'use client';

import { AlertCircle, ArrowLeft, Calendar, Clock, Copy, Share2, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getSupabaseClient } from '@/lib/supabase/client';

interface ReadingCircle {
  id: string;
  title: string;
  purpose?: string;
  description?: string;
  invite_url: string;
  status: string;
  created_at: string;
  book?: {
    id: string;
    title: string;
    author: string;
    img_url: string;
  };
  bookCandidates?: Array<{
    book_id: string;
    is_selected: boolean;
    books: {
      id: string;
      title: string;
      author: string;
      img_url: string;
    };
  }>;
  settings?: {
    max_participants: number;
    is_public: boolean;
    requires_approval: boolean;
  };
  members?: Array<{
    id: string;
    user_id: string;
    role: string;
  }>;
  scheduleCandidates?: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

export default function ReadingCircleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [circle, setCircle] = useState<ReadingCircle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCircleDetails();
  }, [id]);

  const fetchCircleDetails = async () => {
    try {
      const supabase = getSupabaseClient();

      // 読書会の詳細を取得
      const { data: circleData, error: circleError } = await supabase
        .from('bookclubs')
        .select(
          `
          *,
          books (
            id,
            title,
            author,
            img_url
          ),
          bookclub_book_candidates (
            book_id,
            is_selected,
            books (
              id,
              title,
              author,
              img_url
            )
          ),
          bookclub_settings (
            max_participants,
            is_public,
            requires_approval
          ),
          bookclub_members (
            id,
            user_id,
            role
          ),
          bookclub_schedule_candidates (
            id,
            day_of_week,
            start_time,
            end_time
          )
        `
        )
        .eq('id', id)
        .single();

      if (circleError) {
        throw new Error('読書会の情報を取得できませんでした');
      }

      setCircle({
        ...circleData,
        book: circleData.books,
        bookCandidates: circleData.bookclub_book_candidates,
        settings: circleData.bookclub_settings?.[0],
        members: circleData.bookclub_members,
        scheduleCandidates: circleData.bookclub_schedule_candidates,
      });
    } catch (err) {
      console.error('Error fetching circle details:', err);
      setError(err instanceof Error ? err.message : '読書会の情報を取得できませんでした');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteUrl = async () => {
    if (!circle?.invite_url) return;

    try {
      await navigator.clipboard.writeText(circle.invite_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('URLのコピーに失敗しました:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-16 pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-16 pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/reading-circles">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">輪読会詳細</h1>
          </div>
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!circle) {
    return null;
  }

  const participantCount = circle.members?.length || 0;
  const maxParticipants = circle.settings?.max_participants || 10;

  // 曜日の表示用配列
  const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="min-h-screen bg-background pt-16 pb-16 md:pb-0">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/reading-circles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">輪読会詳細</h1>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* メインカード */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{circle.title}</CardTitle>
              {circle.purpose && <p className="text-muted-foreground mt-2">{circle.purpose}</p>}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 説明 */}
              {circle.description && (
                <div>
                  <h3 className="font-semibold mb-2">説明</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{circle.description}</p>
                </div>
              )}

              {/* 対象書籍 */}
              {circle.bookCandidates && circle.bookCandidates.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">対象書籍候補</h3>
                  <div className="space-y-3">
                    {circle.bookCandidates.map(candidate => (
                      <div
                        key={candidate.book_id}
                        className={`flex items-center gap-4 p-4 border rounded-lg ${
                          candidate.is_selected ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <img
                          src={candidate.books.img_url}
                          alt={candidate.books.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{candidate.books.title}</p>
                          <p className="text-sm text-muted-foreground">{candidate.books.author}</p>
                          {candidate.is_selected && (
                            <span className="text-xs text-primary font-medium mt-1 inline-block">
                              現在選択中
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 既存の単一書籍表示（後方互換性のため） */}
              {!circle.bookCandidates?.length && circle.book && (
                <div>
                  <h3 className="font-semibold mb-2">対象書籍</h3>
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <img
                      src={circle.book.img_url}
                      alt={circle.book.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{circle.book.title}</p>
                      <p className="text-sm text-muted-foreground">{circle.book.author}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 参加者情報 */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {participantCount}/{maxParticipants}人参加
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>{new Date(circle.created_at).toLocaleDateString('ja-JP')}作成</span>
                </div>
              </div>

              {/* スケジュール候補 */}
              {circle.scheduleCandidates && circle.scheduleCandidates.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">開催候補日時</h3>
                  <div className="space-y-2">
                    {circle.scheduleCandidates
                      .sort((a, b) => {
                        // 曜日でソート、同じ曜日なら開始時間でソート
                        if (a.day_of_week !== b.day_of_week) {
                          return a.day_of_week - b.day_of_week;
                        }
                        return a.start_time.localeCompare(b.start_time);
                      })
                      .map(schedule => (
                        <div
                          key={schedule.id}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {DAYS_OF_WEEK[schedule.day_of_week]}曜日
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {schedule.start_time} - {schedule.end_time}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    ※ 実際の開催日時は参加者と相談して決定します
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 共有カード */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                参加者を招待
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                以下のURLを共有して、参加者を募集しましょう。
              </p>
              <div className="flex items-center gap-2">
                <Input value={circle.invite_url} readOnly className="flex-1" />
                <Button onClick={copyInviteUrl} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {copied && <p className="text-green-600 text-sm mt-2">URLをコピーしました！</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
