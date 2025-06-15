'use client';

import { AlertCircle, Check, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from '@/hooks/useDebounce';
import { searchBooksWithSuggestions } from '@/lib/api/books';
import { getSupabaseSession } from '@/lib/supabase';
import { Book } from '@/types';

interface TimeSlot {
  day: number;
  hour: number;
  selected: boolean;
}

interface FormData {
  title: string;
  purpose: string;
  description: string;
  book_candidates: Book[];
  selected_books: Book[];
  schedule_slots: TimeSlot[];
  max_participants: number;
  is_public: boolean;
  requires_approval: boolean;
}

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5:00-22:00

export function CreateCircleForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    title: '',
    purpose: '',
    description: '',
    book_candidates: [],
    selected_books: [],
    schedule_slots: [],
    max_participants: 10,
    is_public: true,
    requires_approval: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ドラッグ選択用の状態
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: number; hour: number } | null>(null);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');

  const debouncedSearchTerm = useDebounce(bookSearchQuery, 500);

  // 書籍検索の実行
  useEffect(() => {
    if (debouncedSearchTerm) {
      handleBookSearch(true);
    } else {
      setSearchResults([]);
      setHasMoreResults(false);
      setCurrentPage(0);
    }
  }, [debouncedSearchTerm]);

  // グローバルマウスイベントリスナーの設定（ドラッグ機能用）
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // マウスがグリッド外に出た場合の処理
        e.preventDefault();
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.body.style.userSelect = 'none'; // テキスト選択を無効化
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.body.style.userSelect = ''; // テキスト選択を復元
    };
  }, [isDragging]);

  const handleBookSearch = async (isNewSearch = false) => {
    if (!debouncedSearchTerm.trim()) return;

    const pageToLoad = isNewSearch ? 0 : currentPage + 1;
    const startIndex = pageToLoad * 20;

    if (isNewSearch) {
      setIsSearching(true);
      setSearchResults([]);
      setCurrentPage(0);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const { books, hasMore: moreAvailable } = await searchBooksWithSuggestions(
        debouncedSearchTerm,
        startIndex,
        20
      );

      if (isNewSearch) {
        setSearchResults(books);
      } else {
        setSearchResults(prev => [...prev, ...books]);
      }

      setHasMoreResults(moreAvailable);
      setCurrentPage(pageToLoad);
    } catch (error) {
      console.error('検索エラー:', error);
      if (isNewSearch) {
        setSearchResults([]);
      }
      setHasMoreResults(false);
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMoreResults = () => {
    if (!isLoadingMore && hasMoreResults) {
      handleBookSearch(false);
    }
  };

  // バリデーション
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) {
        newErrors.title = 'タイトルは必須です';
      } else if (formData.title.length > 100) {
        newErrors.title = 'タイトルは100文字以内で入力してください';
      }
      if (formData.description.length > 1000) {
        newErrors.description = '説明は1000文字以内で入力してください';
      }
    }

    if (step === 2) {
      if (formData.schedule_slots.length === 0) {
        newErrors.schedule = '少なくとも1つの時間帯を選択してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 検索結果から書籍を選択
  const handleBookSelect = (book: Book) => {
    // 既に選択されているかチェック
    if (formData.book_candidates.some(b => b.id === book.id)) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      book_candidates: [...prev.book_candidates, book],
    }));
    setBookSearchQuery('');
    setSearchResults([]);
  };

  // 選択された書籍を削除
  const removeSelectedBook = (index: number) => {
    setFormData(prev => ({
      ...prev,
      book_candidates: prev.book_candidates.filter((_, i) => i !== index),
    }));
  };

  // タイムスロットの切り替え
  const toggleTimeSlot = (day: number, hour: number) => {
    setFormData(prev => {
      const existingSlotIndex = prev.schedule_slots.findIndex(
        slot => slot.day === day && slot.hour === hour
      );

      if (existingSlotIndex >= 0) {
        // 既存のスロットを削除
        return {
          ...prev,
          schedule_slots: prev.schedule_slots.filter((_, i) => i !== existingSlotIndex),
        };
      } else {
        // 新しいスロットを追加
        return {
          ...prev,
          schedule_slots: [...prev.schedule_slots, { day, hour, selected: true }],
        };
      }
    });
  };

  // タイムスロットが選択されているかチェック
  const isTimeSlotSelected = (day: number, hour: number): boolean => {
    return formData.schedule_slots.some(slot => slot.day === day && slot.hour === hour);
  };

  // ドラッグ範囲内のスロットを取得
  const getSlotsInDragRange = (
    start: { day: number; hour: number },
    end: { day: number; hour: number }
  ) => {
    const slots: { day: number; hour: number }[] = [];

    const minDay = Math.min(start.day, end.day);
    const maxDay = Math.max(start.day, end.day);
    const minHour = Math.min(start.hour, end.hour);
    const maxHour = Math.max(start.hour, end.hour);

    for (let day = minDay; day <= maxDay; day++) {
      for (let hour = minHour; hour <= maxHour; hour++) {
        slots.push({ day, hour });
      }
    }

    return slots;
  };

  // ドラッグ中かどうかをチェック
  const isInDragRange = (day: number, hour: number): boolean => {
    if (!isDragging || !dragStart || !dragEnd) return false;

    const minDay = Math.min(dragStart.day, dragEnd.day);
    const maxDay = Math.max(dragStart.day, dragEnd.day);
    const minHour = Math.min(dragStart.hour, dragEnd.hour);
    const maxHour = Math.max(dragStart.hour, dragEnd.hour);

    return day >= minDay && day <= maxDay && hour >= minHour && hour <= maxHour;
  };

  // ドラッグ開始
  const handleMouseDown = (day: number, hour: number) => {
    setIsDragging(true);
    setDragStart({ day, hour });
    setDragEnd({ day, hour });

    // 現在のスロットの状態に基づいてドラッグモードを決定
    const isCurrentlySelected = isTimeSlotSelected(day, hour);
    setDragMode(isCurrentlySelected ? 'deselect' : 'select');
  };

  // ドラッグ中
  const handleMouseEnter = (day: number, hour: number) => {
    if (isDragging && dragStart) {
      setDragEnd({ day, hour });
    }
  };

  // ドラッグ終了
  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const slotsInRange = getSlotsInDragRange(dragStart, dragEnd);

      setFormData(prev => {
        const newScheduleSlots = [...prev.schedule_slots];

        slotsInRange.forEach(({ day, hour }) => {
          const existingIndex = newScheduleSlots.findIndex(
            slot => slot.day === day && slot.hour === hour
          );

          if (dragMode === 'select') {
            // 選択モード：まだ選択されていないスロットを追加
            if (existingIndex === -1) {
              newScheduleSlots.push({ day, hour, selected: true });
            }
          } else {
            // 選択解除モード：選択されているスロットを削除
            if (existingIndex >= 0) {
              newScheduleSlots.splice(existingIndex, 1);
            }
          }
        });

        return {
          ...prev,
          schedule_slots: newScheduleSlots,
        };
      });
    }

    // ドラッグ状態をリセット
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // ステップナビゲーション
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // フォーム送信
  const handleSubmit = async () => {
    // ユーザー認証チェック
    if (!user) {
      setError('ログインが必要です。ログインしてから再度お試しください。');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const requestBody = {
        title: formData.title,
        purpose: formData.purpose,
        description: formData.description,
        book_candidates: formData.book_candidates.map(book => book.isbn || book.id), // ISBNを優先、なければIDを使用
        selected_books: formData.book_candidates, // 書籍の詳細情報を追加
        schedule_candidates: formData.schedule_slots
          .filter(slot => slot.selected)
          .map(slot => ({
            day_of_week: slot.day,
            start_time: `${String(slot.hour).padStart(2, '0')}:00`,
            end_time: `${String(slot.hour + 1).padStart(2, '0')}:00`,
          })),
        max_participants: formData.max_participants,
        is_public: formData.is_public,
        requires_approval: formData.requires_approval,
      };

      // console.log('リクエストデータ:', {
      //   requestBody,
      //   authToken: await getSupabaseSession(),
      //   hasAuthToken: !!(await getSupabaseSession()),
      //   bookIds: requestBody.book_candidates,
      //   bookIdsTypes: requestBody.book_candidates.map((id: string | number) => typeof id),
      // });

      const response = await fetch('/api/reading-circles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getSupabaseSession()}`,
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      // console.log('APIレスポンス:', {
      //   status: response.status,
      //   statusText: response.statusText,
      //   headers: Object.fromEntries(response.headers.entries()),
      // });

      if (!response.ok) {
        const errorData = await response.json();
        // console.error('APIエラー:', errorData);
        throw new Error(errorData.error || '読書会の作成に失敗しました');
      }

      const responseData = await response.json();
      // console.log('APIレスポンスデータ:', responseData);

      // 成功後はすぐに詳細ページに遷移
      router.push(`/reading-circles/${responseData.id}`);
    } catch (err) {
      // console.error('Error in form submission:', err);
      setError(
        err instanceof Error
          ? err.message
          : '読書会の作成に失敗しました。しばらく待ってから再度お試しください。'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ステップのタイトルと説明
  const getStepInfo = (step: number) => {
    switch (step) {
      case 1:
        return {
          title: 'ステップ 1: 基本情報',
          description: '読書会の基本的な情報を入力してください',
        };
      case 2:
        return {
          title: 'ステップ 2: スケジュール設定',
          description: '開催可能な日時を選択してください',
        };
      case 3:
        return {
          title: 'ステップ 3: 確認・招待',
          description: '入力内容を確認して読書会を作成します',
        };
      default:
        return { title: '', description: '' };
    }
  };

  const stepInfo = getStepInfo(currentStep);

  return (
    <div className="max-w-4xl mx-auto">
      {/* プログレスバー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map(step => (
            <div key={step} className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                  ${
                    step === currentStep
                      ? 'bg-blue-600 text-white border-blue-600'
                      : step < currentStep
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-300 text-gray-500'
                  }
                `}
              >
                {step < currentStep ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`w-20 h-0.5 mx-2 ${
                    step < currentStep ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">{stepInfo.title}</h2>
          <p className="text-gray-600 mt-1">{stepInfo.description}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* エラー・成功メッセージ */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ステップ 1: 基本情報 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="title">読書会タイトル *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => {
                    const newTitle = e.target.value;
                    setFormData(prev => ({ ...prev, title: newTitle }));

                    // リアルタイムバリデーション
                    if (newTitle.length > 100) {
                      setErrors(prev => ({
                        ...prev,
                        title: 'タイトルは100文字以内で入力してください',
                      }));
                    } else {
                      setErrors(prev => ({ ...prev, title: '' }));
                    }
                  }}
                  placeholder="例: TypeScript実践入門 輪読会"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="purpose">目的</Label>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={e => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="例: TypeScriptの理解を深めて実践的なスキルを身につける"
                />
              </div>

              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => {
                    const newDescription = e.target.value;
                    setFormData(prev => ({ ...prev, description: newDescription }));

                    // リアルタイムバリデーション
                    if (newDescription.length > 1000) {
                      setErrors(prev => ({
                        ...prev,
                        description: '説明は1000文字以内で入力してください',
                      }));
                    } else {
                      setErrors(prev => ({ ...prev, description: '' }));
                    }
                  }}
                  placeholder="例: 週1回のペースで進め、章ごとに担当者を決めて発表形式で行います。質疑応答の時間も設けて理解を深めます。"
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">{formData.description.length}/1000文字</p>
              </div>

              <div>
                <Label>対象書籍（候補）</Label>
                <div className="space-y-4 mt-2">
                  {/* 選択された書籍の表示 */}
                  {formData.book_candidates.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">選択された書籍:</p>
                      {formData.book_candidates.map((book, _index) => (
                        <div
                          key={book.id}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 cursor-pointer"
                          onClick={() => removeSelectedBook(_index)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              removeSelectedBook(_index);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`${book.title}を削除`}
                        >
                          <img
                            src={book.img_url}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">{book.title}</h4>
                            <p className="text-xs text-gray-600">{book.author}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 書籍検索フィールド */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="書籍名、著者名、ISBNで検索..."
                        value={bookSearchQuery}
                        onChange={e => setBookSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* 検索結果 */}
                    {bookSearchQuery && (
                      <div className="max-h-80 overflow-y-auto border rounded-lg">
                        {isSearching && (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            <span>検索中...</span>
                          </div>
                        )}

                        {!isSearching && searchResults.length === 0 && bookSearchQuery && (
                          <div className="text-center py-8 text-muted-foreground">
                            検索結果が見つかりませんでした
                          </div>
                        )}

                        {!isSearching && searchResults.length > 0 && (
                          <div className="p-2">
                            <div className="space-y-2">
                              {searchResults.map(book => (
                                <div
                                  key={book.id}
                                  className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg border"
                                  onClick={() => handleBookSelect(book)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      handleBookSelect(book);
                                    }
                                  }}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={book.img_url}
                                      alt={book.title}
                                      className="w-12 h-16 object-cover rounded flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                                        {book.title}
                                      </h4>
                                      <p className="text-xs text-muted-foreground">{book.author}</p>
                                      {book.categories && book.categories.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {book.categories.slice(0, 2).map((category, index) => (
                                            <span
                                              key={index}
                                              className="text-xs bg-muted px-2 py-0.5 rounded"
                                            >
                                              {category}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <Button variant="outline" size="sm">
                                      選択
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* もっと見るボタン */}
                            {hasMoreResults && (
                              <div className="flex justify-center mt-3 pt-3 border-t">
                                <Button
                                  variant="outline"
                                  onClick={handleLoadMoreResults}
                                  disabled={isLoadingMore}
                                  size="sm"
                                >
                                  {isLoadingMore ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                      読み込み中...
                                    </>
                                  ) : (
                                    'もっと見る'
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ステップ 2: スケジュール設定 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  📅 開催可能な日時を選択してください
                </h3>
                {errors.schedule && <p className="text-red-500 text-sm mb-4">{errors.schedule}</p>}

                {/* 時間グリッド */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                      {/* グリッドコンテナ */}
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        {/* ヘッダー行（固定） */}
                        <div className="grid grid-cols-8 border-b border-gray-300 sticky top-0 z-10 bg-white">
                          <div className="h-12 bg-gray-50 border-r border-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">時間</span>
                          </div>
                          {DAYS_OF_WEEK.map((day, dayIndex) => (
                            <div
                              key={dayIndex}
                              className={`
                                h-12 border-r border-gray-300 last:border-r-0 flex items-center justify-center text-sm font-bold
                                ${
                                  dayIndex === 0
                                    ? 'bg-red-50 text-red-700' // 日曜日
                                    : dayIndex === 6
                                      ? 'bg-blue-50 text-blue-700' // 土曜日
                                      : 'bg-gray-50 text-gray-700' // 平日
                                }
                              `}
                            >
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* 時間スロット（スクロール可能エリア） */}
                        <div className="max-h-96 overflow-y-auto">
                          {HOURS.map((hour, hourIndex) => (
                            <div
                              key={hour}
                              className={`grid grid-cols-8 ${hourIndex < HOURS.length - 1 ? 'border-b border-gray-300' : ''}`}
                            >
                              <div className="h-12 bg-gray-50 border-r border-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">{hour}:00</span>
                              </div>
                              {DAYS_OF_WEEK.map((day, dayIndex) => {
                                const isSelected = isTimeSlotSelected(dayIndex, hour);
                                const isInDrag = isInDragRange(dayIndex, hour);
                                const willBeSelected =
                                  isDragging && isInDrag ? dragMode === 'select' : isSelected;
                                const willBeDeselected =
                                  isDragging && isInDrag ? dragMode === 'deselect' : false;

                                return (
                                  <button
                                    key={`${dayIndex}-${hour}`}
                                    type="button"
                                    onClick={() => toggleTimeSlot(dayIndex, hour)}
                                    onMouseDown={() => handleMouseDown(dayIndex, hour)}
                                    onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                                    onMouseUp={handleMouseUp}
                                    aria-label={`${day}曜日 ${hour}:00-${hour + 1}:00`}
                                    className={`
                                      h-12 border-r border-gray-300 last:border-r-0 transition-all duration-200 relative select-none
                                      ${
                                        willBeSelected && !willBeDeselected
                                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-inner'
                                          : willBeDeselected
                                            ? 'bg-gradient-to-br from-red-400 to-red-500 text-white shadow-inner'
                                            : isInDrag && dragMode === 'select'
                                              ? 'bg-gradient-to-br from-blue-300 to-blue-400 text-white shadow-inner'
                                              : isInDrag && dragMode === 'deselect'
                                                ? 'bg-gradient-to-br from-red-300 to-red-400 text-white shadow-inner'
                                                : 'bg-white hover:bg-blue-50 hover:shadow-sm'
                                      }
                                      ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
                                    `}
                                    style={{ userSelect: 'none' }}
                                  >
                                    {willBeSelected && !willBeDeselected && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                          <Check className="w-4 h-4 text-white" />
                                        </div>
                                      </div>
                                    )}
                                    {willBeDeselected && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                          <span className="text-white text-lg">×</span>
                                        </div>
                                      </div>
                                    )}
                                    {isInDrag && !isSelected && dragMode === 'select' && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                          <span className="text-white text-lg">+</span>
                                        </div>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">💡</div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        スケジュール選択について
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>ドラッグ選択:</strong>{' '}
                        クリックしたまま範囲をドラッグして複数の時間帯を一括選択できます。
                        <br />
                        複数の候補日時を選択することで、参加者が都合の良い時間を投票できます。
                        <br />
                        <strong>
                          最終的な開催時間は、参加メンバーの投票結果を考慮して決定されます。
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ステップ 3: 確認・招待 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">入力内容の確認</h3>

                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">読書会タイトル</p>
                    <p className="text-gray-700">{formData.title}</p>
                  </div>

                  {formData.purpose && (
                    <div>
                      <p className="font-medium">目的</p>
                      <p className="text-gray-700">{formData.purpose}</p>
                    </div>
                  )}

                  {formData.description && (
                    <div>
                      <p className="font-medium">説明</p>
                      <p className="text-gray-700">{formData.description}</p>
                    </div>
                  )}

                  <div>
                    <p className="font-medium">対象書籍</p>
                    <div className="text-gray-700">
                      {/* 選択された書籍を優先表示 */}
                      {formData.book_candidates.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {formData.book_candidates.map((book, _index) => (
                            <div key={book.id} className="flex items-center gap-2 text-sm">
                              <img
                                src={book.img_url}
                                alt={book.title}
                                className="w-8 h-10 object-cover rounded flex-shrink-0"
                              />
                              <div>
                                <div className="font-medium">{book.title}</div>
                                <div className="text-xs text-gray-600">{book.author}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {formData.book_candidates.length === 0 && (
                        <p className="text-gray-500">未選択</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-3 flex items-center gap-2">
                      📅 選択されたタイムスロット
                    </p>
                    <div className="text-gray-700">
                      {formData.schedule_slots.length > 0 ? (
                        <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
                          {(() => {
                            // 選択されている曜日と時間帯を取得
                            const selectedDays = Array.from(
                              new Set(formData.schedule_slots.map(slot => slot.day))
                            ).sort((a, b) => a - b);
                            const selectedHours = Array.from(
                              new Set(formData.schedule_slots.map(slot => slot.hour))
                            ).sort((a, b) => a - b);

                            if (selectedDays.length === 0 || selectedHours.length === 0) {
                              return null;
                            }

                            return (
                              <div className="overflow-x-auto">
                                <div className="min-w-fit">
                                  {/* ヘッダー行 */}
                                  <div
                                    className={`grid gap-0`}
                                    style={{
                                      gridTemplateColumns: `80px repeat(${selectedDays.length}, 1fr)`,
                                    }}
                                  >
                                    <div className="h-12 bg-gray-100 border-r border-b border-gray-300 flex items-center justify-center">
                                      <span className="text-sm font-medium text-gray-600">
                                        時間
                                      </span>
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
                                  {selectedHours.map((hour, hourIndex) => (
                                    <div
                                      key={hour}
                                      className={`grid gap-0 ${hourIndex < selectedHours.length - 1 ? 'border-b border-gray-300' : ''}`}
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
                                        const isSelected = isTimeSlotSelected(dayIndex, hour);
                                        return (
                                          <div
                                            key={`${dayIndex}-${hour}`}
                                            className={`
                                              h-12 border-r border-gray-300 last:border-r-0 flex items-center justify-center relative
                                              ${
                                                isSelected
                                                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-inner'
                                                  : 'bg-gray-100'
                                              }
                                            `}
                                          >
                                            {isSelected && (
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
                      ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-4xl mb-2">📅</div>
                          <p>タイムスロットが選択されていません</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    作成中...
                  </>
                ) : (
                  '読書会を作成'
                )}
              </Button>
            </div>
          )}

          {/* ナビゲーションボタン */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              前へ
            </Button>

            {currentStep < 3 ? (
              <Button type="button" onClick={handleNext}>
                次へ
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
