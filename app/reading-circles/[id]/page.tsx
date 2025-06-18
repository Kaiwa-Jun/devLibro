'use client';

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Heart,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

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

  const fetchCircleDetails = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchCircleDetails();
  }, [fetchCircleDetails]);

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 pt-16 pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 pt-16 pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/reading-circles">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/50">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              輪読会詳細 ✨
            </h1>
          </div>
          <Alert variant="destructive" className="max-w-2xl mx-auto shadow-lg">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 pt-16 pb-16 md:pb-0">
      <div className="container mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/reading-circles">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-white/50 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              輪読会詳細
            </h1>
            <Sparkles className="h-6 w-6 text-purple-500" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* メインカード */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2"></div>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold text-gray-800 mb-2 leading-tight">
                    {circle.title}
                  </CardTitle>
                  {circle.purpose && (
                    <p className="text-lg text-purple-600 font-medium flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      {circle.purpose}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full px-4 py-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-700">
                    {participantCount}/{maxParticipants}人
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* 説明 */}
              {circle.description && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800">
                    📝 輪読会について
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {circle.description}
                  </p>
                </div>
              )}

              {/* 対象書籍 */}
              {circle.bookCandidates && circle.bookCandidates.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    📚 対象書籍候補
                  </h3>
                  <div className="space-y-4">
                    {circle.bookCandidates.map(candidate => (
                      <div
                        key={candidate.book_id}
                        className={`group flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 hover:shadow-lg ${
                          candidate.is_selected
                            ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 shadow-md'
                            : 'bg-white/60 border border-gray-200 hover:bg-white/80'
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={candidate.books.img_url}
                            alt={candidate.books.title}
                            className="w-16 h-20 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-300"
                          />
                          {candidate.is_selected && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full p-1">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-lg mb-1">
                            {candidate.books.title}
                          </p>
                          <p className="text-gray-600 mb-2">{candidate.books.author}</p>
                          {candidate.is_selected && (
                            <span className="inline-flex items-center gap-1 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full font-medium">
                              <Sparkles className="h-3 w-3" />
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
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    📚 対象書籍
                  </h3>
                  <div className="flex items-center gap-4 p-5 bg-white/60 border border-gray-200 rounded-2xl hover:bg-white/80 transition-all duration-300 hover:shadow-lg">
                    <img
                      src={circle.book.img_url}
                      alt={circle.book.title}
                      className="w-16 h-20 object-cover rounded-lg shadow-md"
                    />
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{circle.book.title}</p>
                      <p className="text-gray-600">{circle.book.author}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 基本情報 */}
              <div className="flex flex-wrap items-center gap-6 bg-white/60 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">作成日</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(circle.created_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* スケジュール候補 - 輪読会作成の確認画面と同じスタイル */}
              {circle.scheduleCandidates && circle.scheduleCandidates.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    📅 開催候補日時
                  </h3>
                  <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
                    {(() => {
                      // 選択されている曜日と時間帯を取得
                      const schedulesByDay = circle.scheduleCandidates!.reduce(
                        (acc, schedule) => {
                          if (!acc[schedule.day_of_week]) {
                            acc[schedule.day_of_week] = [];
                          }
                          acc[schedule.day_of_week].push(schedule);
                          return acc;
                        },
                        {} as Record<number, typeof circle.scheduleCandidates>
                      );

                      const selectedDays = Object.keys(schedulesByDay)
                        .map(Number)
                        .sort((a, b) => a - b);
                      const allHours = Array.from(
                        new Set(
                          circle.scheduleCandidates!.map(s => parseInt(s.start_time.split(':')[0]))
                        )
                      ).sort((a, b) => a - b);

                      if (selectedDays.length === 0 || allHours.length === 0) {
                        return null;
                      }

                      return (
                        <div className="overflow-x-auto">
                          <div className="min-w-fit">
                            {/* ヘッダー行 */}
                            <div
                              className="grid gap-0"
                              style={{
                                gridTemplateColumns: `80px repeat(${selectedDays.length}, 1fr)`,
                              }}
                            >
                              <div className="h-12 bg-gray-100 border-r border-b border-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">時間</span>
                              </div>
                              {selectedDays.map(dayIndex => (
                                <div
                                  key={dayIndex}
                                  className={`
                                    h-12 flex items-center justify-center text-sm font-bold border-r border-b border-gray-300 last:border-r-0
                                    ${
                                      dayIndex === 0
                                        ? 'bg-red-50 text-red-700' // 日曜日
                                        : dayIndex === 6
                                          ? 'bg-blue-50 text-blue-700' // 土曜日
                                          : 'bg-gray-50 text-gray-700' // 平日
                                    }
                                  `}
                                >
                                  {DAYS_OF_WEEK[dayIndex]}
                                </div>
                              ))}
                            </div>

                            {/* 時間スロット */}
                            {allHours.map((hour, hourIndex) => (
                              <div
                                key={hour}
                                className={`grid gap-0 ${hourIndex < allHours.length - 1 ? 'border-b border-gray-300' : ''}`}
                                style={{
                                  gridTemplateColumns: `80px repeat(${selectedDays.length}, 1fr)`,
                                }}
                              >
                                <div className="h-12 bg-gray-50 border-r border-gray-300 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {hour}:00
                                  </span>
                                </div>
                                {selectedDays.map(dayIndex => {
                                  const hasSchedule = schedulesByDay[dayIndex]?.some(
                                    s => parseInt(s.start_time.split(':')[0]) === hour
                                  );
                                  return (
                                    <div
                                      key={`${dayIndex}-${hour}`}
                                      className={`
                                        h-12 border-r border-gray-300 last:border-r-0 flex items-center justify-center relative
                                        ${
                                          hasSchedule
                                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-inner'
                                            : 'bg-gray-100'
                                        }
                                      `}
                                    >
                                      {hasSchedule && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 mt-0.5">💡</div>
                      <div>
                        <p className="text-sm text-blue-800 font-medium mb-1">
                          スケジュールについて
                        </p>
                        <p className="text-sm text-blue-700">
                          上記の時間帯が開催候補です。実際の開催日時は参加メンバーの都合を考慮して決定されます。
                          <br />
                          <strong>参加者全員で相談して、最適な時間を見つけましょう！</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 共有カード */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 p-2 rounded-full">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  みんなを招待しよう！
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6 text-lg">
                以下のURLをシェアして、仲間を集めましょう ✨
              </p>
              <div className="flex items-center gap-3">
                <Input
                  value={circle.invite_url}
                  readOnly
                  className="flex-1 h-12 text-base bg-white/80 border-2 border-gray-200 rounded-xl focus:border-blue-400 transition-colors"
                />
                <Button
                  onClick={copyInviteUrl}
                  className="h-12 px-6 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  コピー
                </Button>
              </div>
              {copied && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-700 font-medium flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    URLをコピーしました！シェアして仲間を集めよう 🎉
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
