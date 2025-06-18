'use client';

import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Heart,
  Share2,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { startTransition, useCallback, useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// 曜日の定義
const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

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
  book_candidates?: Array<{
    book_id: number;
    is_selected: boolean;
    vote_count: number;
    user_voted: boolean;
    books: {
      id: string;
      title: string;
      author: string;
      img_url: string;
    };
  }>;
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
    vote_count?: number;
    user_voted?: boolean;
  }>;
  schedule_candidates?: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    vote_count?: number;
    user_voted?: boolean;
  }>;
}

export default function ReadingCircleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [circle, setCircle] = useState<ReadingCircle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<number, number>>({});
  const [localScheduleVotes, setLocalScheduleVotes] = useState<Set<string>>(new Set());

  // ドラッグ選択用の状態
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: number; hour: number } | null>(null);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');
  const [dragTimeout, setDragTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchCircleDetails = useCallback(async () => {
    try {
      // APIから詳細情報を取得（投票情報も含む）
      const response = await fetch(`/api/reading-circles/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('読書会の情報を取得できませんでした');
      }

      const data = await response.json();
      setCircle(data);

      // 初期の投票数を設定
      if (data.book_candidates) {
        const initialVoteCounts: Record<number, number> = {};
        data.book_candidates.forEach((candidate: { book_id: number; vote_count: number }) => {
          initialVoteCounts[candidate.book_id] = candidate.vote_count || 0;
        });
        setVoteCounts(initialVoteCounts);
      }
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

  const handleVote = (bookId: number) => {
    // View Transitionでアニメーションを実行
    if ('startViewTransition' in document && document.startViewTransition) {
      document.startViewTransition(() => {
        startTransition(() => {
          // 現在投票している書籍と同じ場合は投票取消、違う場合は新しく投票
          if (selectedBookId === bookId) {
            // 投票取消
            setSelectedBookId(null);
            setVoteCounts(prev => ({
              ...prev,
              [bookId]: Math.max(0, (prev[bookId] || 0) - 1),
            }));
          } else {
            // 前の投票を取り消し（もしあれば）
            if (selectedBookId !== null) {
              setVoteCounts(prev => ({
                ...prev,
                [selectedBookId]: Math.max(0, (prev[selectedBookId] || 0) - 1),
              }));
            }

            // 新しく投票
            setSelectedBookId(bookId);
            setVoteCounts(prev => ({
              ...prev,
              [bookId]: (prev[bookId] || 0) + 1,
            }));
          }
        });
      });
    } else {
      // View Transitionがサポートされていない場合は通常の処理
      startTransition(() => {
        if (selectedBookId === bookId) {
          setSelectedBookId(null);
          setVoteCounts(prev => ({
            ...prev,
            [bookId]: Math.max(0, (prev[bookId] || 0) - 1),
          }));
        } else {
          if (selectedBookId !== null) {
            setVoteCounts(prev => ({
              ...prev,
              [selectedBookId]: Math.max(0, (prev[selectedBookId] || 0) - 1),
            }));
          }

          setSelectedBookId(bookId);
          setVoteCounts(prev => ({
            ...prev,
            [bookId]: (prev[bookId] || 0) + 1,
          }));
        }
      });
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

  const handleScheduleVote = (scheduleId: string) => {
    setLocalScheduleVotes(prev => {
      const newVotes = new Set(prev);
      if (newVotes.has(scheduleId)) {
        newVotes.delete(scheduleId);
      } else {
        newVotes.add(scheduleId);
      }
      return newVotes;
    });
  };

  // ドラッグ選択のヘルパー関数
  const getScheduleId = (
    day: number,
    hour: number,
    schedules: ReadingCircle['schedule_candidates']
  ) => {
    const schedule = schedules?.find(
      s => s.day_of_week === day && parseInt(s.start_time.split(':')[0]) === hour
    );
    return schedule?.id;
  };

  const isInDragRange = (day: number, hour: number) => {
    if (!isDragging || !dragStart || !dragEnd) return false;

    const minDay = Math.min(dragStart.day, dragEnd.day);
    const maxDay = Math.max(dragStart.day, dragEnd.day);
    const minHour = Math.min(dragStart.hour, dragEnd.hour);
    const maxHour = Math.max(dragStart.hour, dragEnd.hour);

    return day >= minDay && day <= maxDay && hour >= minHour && hour <= maxHour;
  };

  // ドラッグイベントハンドラー
  const handleMouseDown = (day: number, hour: number, scheduleId: string | undefined) => {
    if (!scheduleId) return;

    // 既存のタイマーをクリア
    if (dragTimeout) {
      clearTimeout(dragTimeout);
    }

    setDragStart({ day, hour });
    setDragEnd({ day, hour });

    // 現在の選択状態に基づいてドラッグモードを決定
    const isCurrentlySelected = localScheduleVotes.has(scheduleId);
    setDragMode(isCurrentlySelected ? 'deselect' : 'select');

    // 少し遅延してからドラッグ状態にする（短いクリックを除外）
    const timeout = setTimeout(() => {
      setIsDragging(true);
    }, 150);
    setDragTimeout(timeout);
  };

  const handleMouseEnter = (day: number, hour: number) => {
    if (isDragging) {
      setDragEnd({ day, hour });
    }
  };

  const handleMouseUp = () => {
    // タイマーをクリア
    if (dragTimeout) {
      clearTimeout(dragTimeout);
      setDragTimeout(null);
    }

    if (isDragging && dragStart && dragEnd) {
      // ドラッグ範囲内のすべてのスケジュールを選択/選択解除
      const schedules = circle?.schedule_candidates || [];
      const minDay = Math.min(dragStart.day, dragEnd.day);
      const maxDay = Math.max(dragStart.day, dragEnd.day);
      const minHour = Math.min(dragStart.hour, dragEnd.hour);
      const maxHour = Math.max(dragStart.hour, dragEnd.hour);

      setLocalScheduleVotes(prev => {
        const newVotes = new Set(prev);

        for (let day = minDay; day <= maxDay; day++) {
          for (let hour = minHour; hour <= maxHour; hour++) {
            const scheduleId = getScheduleId(day, hour, schedules);
            if (scheduleId) {
              if (dragMode === 'select') {
                newVotes.add(scheduleId);
              } else {
                newVotes.delete(scheduleId);
              }
            }
          }
        }

        return newVotes;
      });
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
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

  // 投票の総数を計算
  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

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
                  <ThumbsUp className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-700">{totalVotes}票</span>
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

              {/* 対象書籍候補（新API対応） */}
              {circle.book_candidates && circle.book_candidates.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    📚 対象書籍候補
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex gap-3">
                      <div className="text-green-600 mt-0.5">💡</div>
                      <div>
                        <p className="text-sm text-green-800 font-medium mb-1">書籍投票について</p>
                        <p className="text-sm text-green-700">
                          読みたい書籍に投票しましょう！投票数の多い書籍が輪読会で読む本になります。
                          <br />
                          <strong>投票はいつでも変更できます。</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 書籍候補一覧 */}
                  <div className="space-y-4" style={{ contain: 'layout style' }}>
                    {circle.book_candidates
                      .sort((a, b) => {
                        const aVotes =
                          voteCounts[a.book_id] !== undefined
                            ? voteCounts[a.book_id]
                            : a.vote_count;
                        const bVotes =
                          voteCounts[b.book_id] !== undefined
                            ? voteCounts[b.book_id]
                            : b.vote_count;
                        return bVotes - aVotes;
                      }) // 投票数順でソート（動的投票数を考慮）
                      .map((candidate, _index) => (
                        <div
                          key={candidate.book_id}
                          style={{
                            viewTransitionName: `book-card-${candidate.book_id}`,
                            contain: 'layout style paint',
                          }}
                          className={`group flex items-center gap-4 p-5 rounded-2xl transition-all duration-700 hover:shadow-lg ${
                            selectedBookId === candidate.book_id
                              ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 shadow-md'
                              : 'bg-white/60 border border-gray-200 hover:bg-white/80'
                          }`}
                        >
                          <div className="relative">
                            <Image
                              src={candidate.books.img_url || '/images/book-placeholder.png'}
                              alt={candidate.books.title}
                              className="w-16 h-20 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-700"
                              width={64}
                              height={80}
                            />
                            {selectedBookId === candidate.book_id && (
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
                            {selectedBookId === candidate.book_id && (
                              <span className="inline-flex items-center gap-1 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full font-medium">
                                <Sparkles className="h-3 w-3" />
                                投票済み
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {/* 投票数表示 */}
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <ThumbsUp className="h-4 w-4" />
                              <span className="font-semibold">
                                {voteCounts[candidate.book_id] !== undefined
                                  ? voteCounts[candidate.book_id]
                                  : candidate.vote_count}
                              </span>
                              <span>票</span>
                            </div>

                            {/* 投票ボタン */}
                            <Button
                              size="sm"
                              variant={selectedBookId === candidate.book_id ? 'default' : 'outline'}
                              onClick={() => handleVote(candidate.book_id)}
                              className={`min-w-[80px] ${
                                selectedBookId === candidate.book_id
                                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                                  : 'border-purple-300 text-purple-600 hover:bg-purple-50'
                              }`}
                            >
                              {selectedBookId === candidate.book_id ? '投票取消' : '投票する'}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 対象書籍候補（旧形式との互換性） */}
              {!circle.book_candidates?.length &&
                circle.bookCandidates &&
                circle.bookCandidates.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                      📚 対象書籍候補
                    </h3>
                    <div className="space-y-4">
                      {circle.bookCandidates.map(candidate => (
                        <div
                          key={candidate.book_id}
                          className={`group flex items-center gap-4 p-5 rounded-2xl transition-all duration-700 hover:shadow-lg ${
                            candidate.is_selected
                              ? 'bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 shadow-md'
                              : 'bg-white/60 border border-gray-200 hover:bg-white/80'
                          }`}
                          style={{
                            viewTransitionName: `book-card-${candidate.book_id}`,
                          }}
                        >
                          <div className="relative">
                            <Image
                              src={candidate.books.img_url}
                              alt={candidate.books.title}
                              className="w-16 h-20 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-700"
                              width={64}
                              height={80}
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
              {!circle.book_candidates?.length && !circle.bookCandidates?.length && circle.book && (
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    📚 対象書籍
                  </h3>
                  <div className="flex items-center gap-4 p-5 bg-white/60 border border-gray-200 rounded-2xl hover:bg-white/80 transition-all duration-700 hover:shadow-lg">
                    <Image
                      src={circle.book.img_url}
                      alt={circle.book.title}
                      className="w-16 h-20 object-cover rounded-lg shadow-md"
                      width={64}
                      height={80}
                    />
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{circle.book.title}</p>
                      <p className="text-gray-600">{circle.book.author}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* スケジュール候補 - 投票機能付き */}
              {circle.schedule_candidates && circle.schedule_candidates.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    📅 開催候補日時
                  </h3>

                  {/* 投票についての説明 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex gap-3">
                      <div className="text-blue-600 mt-0.5">💡</div>
                      <div>
                        <p className="text-sm text-blue-800 font-medium mb-1">
                          スケジュール投票について
                        </p>
                        <p className="text-sm text-blue-700">
                          参加可能な時間帯に投票しましょう！投票数の多い時間帯が開催時間の候補になります。
                          <br />
                          複数の時間帯をまとめて選択したい場合は、ドラッグで範囲選択できます。
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
                    {(() => {
                      // 選択されている曜日と時間帯を取得
                      const schedules = circle.schedule_candidates || [];

                      if (schedules.length === 0) {
                        return (
                          <div className="p-4 text-center text-gray-500">
                            開催候補日時が設定されていません
                          </div>
                        );
                      }

                      const schedulesByDay = schedules.reduce(
                        (acc, schedule) => {
                          if (!acc[schedule.day_of_week]) {
                            acc[schedule.day_of_week] = [];
                          }
                          acc[schedule.day_of_week].push(schedule);
                          return acc;
                        },
                        {} as Record<number, typeof schedules>
                      );

                      const selectedDays = Object.keys(schedulesByDay)
                        .map(Number)
                        .sort((a, b) => a - b);
                      const allHours = Array.from(
                        new Set(schedules.map(s => parseInt(s.start_time.split(':')[0])))
                      ).sort((a, b) => a - b);

                      if (selectedDays.length === 0 || allHours.length === 0) {
                        return null;
                      }

                      return (
                        <div
                          className="overflow-x-auto"
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                          role="grid"
                          tabIndex={0}
                          aria-label="スケジュール投票グリッド"
                        >
                          <div className="min-w-fit select-none">
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
                                  const schedule = schedulesByDay[dayIndex]?.find(
                                    s => parseInt(s.start_time.split(':')[0]) === hour
                                  );

                                  if (!schedule)
                                    return (
                                      <div
                                        key={`${dayIndex}-${hour}`}
                                        className="h-12 border-r border-gray-300 last:border-r-0 bg-gray-100"
                                      />
                                    );

                                  const isVoted = localScheduleVotes.has(schedule.id);
                                  const isInRange = isInDragRange(dayIndex, hour);

                                  return (
                                    <div
                                      key={`${dayIndex}-${hour}`}
                                      className={`
                                        h-12 border-r border-gray-300 last:border-r-0 flex items-center justify-center relative
                                        group cursor-pointer transition-all duration-200
                                        ${
                                          isVoted
                                            ? 'bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-inner'
                                            : isInRange && isDragging
                                              ? dragMode === 'select'
                                                ? 'bg-purple-200 border border-purple-400'
                                                : 'bg-red-200 border border-red-400'
                                              : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                        }
                                      `}
                                      role="gridcell"
                                      tabIndex={0}
                                      aria-label={`${DAYS_OF_WEEK[dayIndex]} ${hour}:00 ${isVoted ? '投票済み' : '未投票'}`}
                                      onMouseDown={() =>
                                        handleMouseDown(dayIndex, hour, schedule.id)
                                      }
                                      onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                                      onClick={e => {
                                        // ドラッグ操作中でない場合のみクリック処理を実行
                                        if (!isDragging) {
                                          handleScheduleVote(schedule.id);
                                        }
                                      }}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          if (!isDragging) {
                                            handleScheduleVote(schedule.id);
                                          }
                                          e.preventDefault();
                                        }
                                      }}
                                    >
                                      {/* 投票数表示 */}
                                      <div className="flex flex-col items-center justify-center gap-0.5">
                                        {isVoted ? (
                                          <div className="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                          </div>
                                        ) : (
                                          <div className="w-5 h-5 border border-gray-300 rounded-full flex items-center justify-center group-hover:border-purple-400 transition-colors">
                                            <ThumbsUp className="w-2.5 h-2.5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                                          </div>
                                        )}
                                        <span
                                          className={`text-xs font-medium ${
                                            isVoted
                                              ? 'text-white'
                                              : 'text-gray-600 group-hover:text-purple-600'
                                          }`}
                                        >
                                          {isVoted ? '1' : '0'}
                                        </span>
                                      </div>
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
