'use client';

import { AlertCircle, Check, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TimeSlot {
  day: number;
  hour: number;
  selected: boolean;
}

interface FormData {
  title: string;
  purpose: string;
  description: string;
  book_candidates: string[];
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
  const [success, setSuccess] = useState<string>('');
  const [inviteUrl, setInviteUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    purpose: '',
    description: '',
    book_candidates: [''],
    schedule_slots: [],
    max_participants: 10,
    is_public: true,
    requires_approval: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
      if (formData.schedule_slots.filter(slot => slot.selected).length === 0) {
        newErrors.schedule = '少なくとも1つのタイムスロットを選択してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 書籍候補の追加
  const addBookCandidate = () => {
    setFormData(prev => ({
      ...prev,
      book_candidates: [...prev.book_candidates, ''],
    }));
  };

  // 書籍候補の削除
  const removeBookCandidate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      book_candidates: prev.book_candidates.filter((_, i) => i !== index),
    }));
  };

  // 書籍候補の更新
  const updateBookCandidate = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      book_candidates: prev.book_candidates.map((book, i) => (i === index ? value : book)),
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

  // URLコピー機能
  const copyInviteUrl = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('URLのコピーに失敗しました:', err);
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
      // スケジュールスロットを従来の形式に変換
      const schedule_candidates = formData.schedule_slots.map(slot => ({
        day_of_week: slot.day,
        start_time: `${slot.hour.toString().padStart(2, '0')}:00`,
        end_time: `${(slot.hour + 1).toString().padStart(2, '0')}:00`,
      }));

      const response = await fetch('/api/reading-circles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookieを含めて送信
        body: JSON.stringify({
          ...formData,
          schedule_candidates,
          book_candidates: formData.book_candidates.filter(book => book.trim() !== ''),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '読書会の作成に失敗しました');
      }

      const result = await response.json();
      setInviteUrl(result.invite_url);
      setSuccess('読書会が作成されました！');

      // 成功後は詳細ページに遷移
      setTimeout(() => {
        router.push(`/reading-circles/${result.id}`);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '読書会の作成に失敗しました');
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

          {success && (
            <Alert className="mb-6">
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
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
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                <div className="space-y-2 mt-2">
                  {formData.book_candidates.map((book, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={book}
                        onChange={e => updateBookCandidate(index, e.target.value)}
                        placeholder={`書籍候補 ${index + 1}: 例: TypeScript実践入門`}
                        className="flex-1"
                      />
                      {formData.book_candidates.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeBookCandidate(index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBookCandidate}
                    className="mt-2"
                  >
                    書籍候補を追加
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ステップ 2: スケジュール設定 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">開催可能な日時を選択してください</h3>
                {errors.schedule && <p className="text-red-500 text-sm mb-4">{errors.schedule}</p>}

                {/* 時間グリッド */}
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {/* ヘッダー行 */}
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      <div className="h-8"></div>
                      {DAYS_OF_WEEK.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`
                            h-8 flex items-center justify-center text-sm font-medium rounded
                            ${
                              dayIndex === 0
                                ? 'bg-red-100 text-red-700' // 日曜日
                                : dayIndex === 6
                                  ? 'bg-blue-100 text-blue-700' // 土曜日
                                  : 'bg-gray-100 text-gray-700' // 平日
                            }
                          `}
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* 時間スロット */}
                    {HOURS.map(hour => (
                      <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                        <div className="h-8 flex items-center justify-center text-xs text-gray-600">
                          {hour}:00
                        </div>
                        {DAYS_OF_WEEK.map((_, dayIndex) => (
                          <button
                            key={`${dayIndex}-${hour}`}
                            type="button"
                            onClick={() => toggleTimeSlot(dayIndex, hour)}
                            className={`
                              h-8 rounded border text-xs transition-colors
                              ${
                                isTimeSlotSelected(dayIndex, hour)
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }
                            `}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-4">
                  クリックしてタイムスロットを選択・解除できます。複数の候補日時を選択することで、参加者が都合の良い時間を選べます。
                </p>
              </div>
            </div>
          )}

          {/* ステップ 3: 確認・招待 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {!success && (
                <>
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
                        <ul className="text-gray-700">
                          {formData.book_candidates
                            .filter(book => book.trim() !== '')
                            .map((book, index) => (
                              <li key={index}>• {book}</li>
                            ))}
                        </ul>
                      </div>

                      <div>
                        <p className="font-medium">選択されたタイムスロット</p>
                        <div className="text-gray-700">
                          {formData.schedule_slots.length > 0 ? (
                            <ul>
                              {formData.schedule_slots.map((slot, index) => (
                                <li key={index}>
                                  • {DAYS_OF_WEEK[slot.day]}曜日 {slot.hour}:00-{slot.hour + 1}:00
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500">未選択</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? '作成中...' : '読書会を作成'}
                  </Button>
                </>
              )}

              {success && inviteUrl && (
                <div className="text-center space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-600">
                      読書会が作成されました！
                    </h3>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="font-medium mb-2">招待URL</p>
                      <div className="flex items-center gap-2">
                        <Input value={inviteUrl} readOnly className="flex-1" />
                        <Button onClick={copyInviteUrl} variant="outline" size="icon">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      {copied && (
                        <p className="text-green-600 text-sm mt-2">URLをコピーしました！</p>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm">
                      この招待URLを共有して、参加者を募集しましょう。
                      <br />
                      3秒後に読書会詳細ページに移動します。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ナビゲーションボタン */}
          {!success && (
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

              {currentStep < 3 && (
                <Button type="button" onClick={handleNext}>
                  次へ
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
