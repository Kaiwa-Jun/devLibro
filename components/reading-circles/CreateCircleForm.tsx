'use client';

import { AlertCircle, ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { BookSearchComponent } from '@/components/book/BookSearchComponent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

  // ドラッグ選択用の状態
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: number; hour: number } | null>(null);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');

  // ドラッグ終了
  const handleMouseUp = useCallback(() => {
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
  }, [isDragging, dragStart, dragEnd, dragMode]);

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
  }, [isDragging, handleMouseUp]);

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* ヘッダー：戻るボタンとプログレスバー */}
      <div className="flex items-center gap-6 mb-8">
        {/* 戻るボタン */}
        <Link href="/reading-circles">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {/* プログレスバー */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-start justify-center max-w-2xl w-full">
            {[
              { number: 1, label: '基本情報', icon: '📝' },
              { number: 2, label: 'スケジュール', icon: '📅' },
              { number: 3, label: '確認', icon: '✓' },
            ].map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      flex items-center justify-center w-16 h-16 rounded-full border-2 text-lg font-bold shadow-lg transition-all duration-300 mb-3
                      ${
                        step.number === currentStep
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent scale-110'
                          : step.number < currentStep
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-transparent'
                            : 'border-gray-300 text-gray-400 bg-white'
                      }
                    `}
                  >
                    {step.number < currentStep ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <span className="text-2xl">
                        {step.number === currentStep ? step.icon : step.number}
                      </span>
                    )}
                  </div>

                  <div className="text-center">
                    <p
                      className={`text-sm font-bold transition-colors duration-300 ${
                        step.number === currentStep
                          ? 'text-blue-600 dark:text-blue-400'
                          : step.number < currentStep
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`text-xs mt-1 transition-colors duration-300 ${
                        step.number === currentStep
                          ? 'text-blue-500 dark:text-blue-300'
                          : step.number < currentStep
                            ? 'text-green-500 dark:text-green-300'
                            : 'text-gray-400'
                      }`}
                    >
                      STEP {step.number}
                    </p>
                  </div>
                </div>

                {index < 2 && (
                  <div className="flex-1 mx-6 mt-8">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        step.number < currentStep
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-xl bg-white dark:bg-gray-800 rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          {/* エラー・成功メッセージ */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ステップ 1: 基本情報 */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* タイトル入力 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-2 rounded-xl">
                    <span className="text-white text-lg">📝</span>
                  </div>
                  <div>
                    <Label
                      htmlFor="title"
                      className="text-lg font-bold text-gray-900 dark:text-white"
                    >
                      読書会タイトル
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      魅力的なタイトルで参加者を惹きつけよう ✨
                    </p>
                  </div>
                </div>
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
                  placeholder="例: TypeScript実践入門 輪読会 🚀"
                  className={`h-14 text-lg rounded-2xl border-2 px-6 transition-all duration-200 ${
                    errors.title
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-pink-400 hover:border-gray-300 bg-white'
                  }`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.title}
                  </p>
                )}
              </div>

              {/* 目的入力 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-xl">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                  <div>
                    <Label
                      htmlFor="purpose"
                      className="text-lg font-bold text-gray-900 dark:text-white"
                    >
                      目的
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      この読書会で何を達成したい？
                    </p>
                  </div>
                </div>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={e => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="例: TypeScriptの理解を深めて実践的なスキルを身につける 💪"
                  className="h-14 text-lg rounded-2xl border-2 border-gray-200 focus:border-blue-400 hover:border-gray-300 px-6 transition-all duration-200 bg-white"
                />
              </div>

              {/* 説明入力 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-xl">
                    <span className="text-white text-lg">📖</span>
                  </div>
                  <div>
                    <Label
                      htmlFor="description"
                      className="text-lg font-bold text-gray-900 dark:text-white"
                    >
                      説明
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      読書会の詳細を教えて！
                    </p>
                  </div>
                </div>
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
                  placeholder="例: 週1回のペースで進め、章ごとに担当者を決めて発表形式で行います。質疑応答の時間も設けて理解を深めます。みんなで楽しく学びましょう！ 🎉"
                  rows={5}
                  className={`text-lg rounded-2xl border-2 px-6 py-4 transition-all duration-200 resize-none ${
                    errors.description
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-purple-400 hover:border-gray-300 bg-white'
                  }`}
                />
                <div className="flex justify-between items-center">
                  {errors.description && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <span>⚠️</span>
                      {errors.description}
                    </p>
                  )}
                  <p
                    className={`text-sm ml-auto ${
                      formData.description.length > 900
                        ? 'text-red-500'
                        : formData.description.length > 800
                          ? 'text-orange-500'
                          : 'text-gray-500'
                    }`}
                  >
                    {formData.description.length}/1000文字
                  </p>
                </div>
              </div>

              {/* 書籍選択 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-xl">
                    <span className="text-white text-lg">📚</span>
                  </div>
                  <div>
                    <Label className="text-lg font-bold text-gray-900 dark:text-white">
                      対象書籍（候補）
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      読みたい本を選んでね 📖
                    </p>
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        💡 <strong>複数選択時:</strong> 参加メンバーの投票で最終的な書籍を決定します
                        <br />
                        📖 <strong>1冊選択時:</strong> 自動的にその書籍に決定されます
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800">
                  {/* 選択された書籍の表示 */}
                  {formData.book_candidates.length > 0 && (
                    <div className="space-y-3 mb-6">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <span>✅</span>
                        選択された書籍:
                      </p>
                      <div className="grid gap-3">
                        {formData.book_candidates.map((book, _index) => (
                          <div
                            key={book.id}
                            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-emerald-200 dark:border-emerald-700 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
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
                            <div className="w-16 h-20 flex-shrink-0 rounded-lg shadow-md overflow-hidden bg-gray-100 flex items-center justify-center">
                              {book.img_url ? (
                                <img
                                  src={book.img_url}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                  onError={e => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML =
                                        '<div class="text-gray-400 text-xs text-center p-1">📚<br/>No Image</div>';
                                    }
                                  }}
                                />
                              ) : (
                                <div className="text-gray-400 text-xs text-center p-1">
                                  📚
                                  <br />
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-lg line-clamp-2 text-gray-900 dark:text-white mb-1">
                                {book.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {book.author}
                              </p>
                            </div>
                            <div className="text-red-500 hover:text-red-600 text-xl">❌</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 書籍検索 */}
                  <BookSearchComponent
                    onBookSelect={handleBookSelect}
                    placeholder="書籍タイトルで検索... 🔍"
                    excludeBooks={formData.book_candidates}
                  />
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
                              <div className="w-8 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                {book.img_url ? (
                                  <img
                                    src={book.img_url}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                    onError={e => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML =
                                          '<div class="text-gray-400 text-xs text-center p-1">📚</div>';
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="text-gray-400 text-xs text-center p-1">📚</div>
                                )}
                              </div>
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

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                    作成中...
                  </>
                ) : (
                  <>
                    <span>読書会を作成</span>
                    <span className="ml-2 text-xl">🚀</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ナビゲーションボタン */}
          <div className="flex justify-between mt-10 pt-8 border-t-2 border-gray-100 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="h-12 px-6 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              <span className="font-medium">前へ</span>
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="font-medium">次へ</span>
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
