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

      console.log('リクエストデータ:', {
        requestBody,
        authToken: await getSupabaseSession(),
        hasAuthToken: !!(await getSupabaseSession()),
        bookIds: requestBody.book_candidates,
        bookIdsTypes: requestBody.book_candidates.map((id: string | number) => typeof id),
      });

      const response = await fetch('/api/reading-circles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getSupabaseSession()}`,
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      console.log('APIレスポンス:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('APIエラー:', errorData);
        throw new Error(errorData.error || '読書会の作成に失敗しました');
      }

      const responseData = await response.json();
      console.log('APIレスポンスデータ:', responseData);

      // 成功後はすぐに詳細ページに遷移
      router.push(`/reading-circles/${responseData.id}`);
    } catch (err) {
      console.error('Error in form submission:', err);
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
    <div className="max-w-4xl">
      {/* プログレスバー */}
      <div>
        <div className="flex justify-center">
          <div className="flex items-center justify-between max-w-3xl w-full px-4">
            {[
              { number: 1, label: '基本情報', icon: '📝' },
              { number: 2, label: 'スケジュール', icon: '📅' },
              { number: 3, label: '確認', icon: '✓' },
            ].map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center w-full">
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
                      className={`text-sm font-bold transition-colors duration-300 whitespace-nowrap ${
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
                  <div className="flex-1 mx-4 mb-16">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        step.number < currentStep
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gray-200 dark:bg-gray-600'
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
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1 rounded-lg">
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                  </div>
                  <Label
                    htmlFor="title"
                    className="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    読書会タイトル *
                  </Label>
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
                  placeholder="例: TypeScript実践入門 輪読会 📚"
                  className={`h-12 text-lg rounded-xl border-2 transition-all duration-200 ${
                    errors.title
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-1 rounded-lg">
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                  </div>
                  <Label
                    htmlFor="purpose"
                    className="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    目的 🎯
                  </Label>
                </div>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={e => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="例: TypeScriptの理解を深めて実践的なスキルを身につける"
                  className="h-12 text-lg rounded-xl border-2 border-gray-200 focus:border-green-500 hover:border-gray-300 transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-1 rounded-lg">
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                  </div>
                  <Label
                    htmlFor="description"
                    className="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    説明 📝
                  </Label>
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
                  placeholder="例: 週1回のペースで進め、章ごとに担当者を決めて発表形式で行います。質疑応答の時間も設けて理解を深めます。 🚀"
                  rows={5}
                  className={`text-lg rounded-xl border-2 transition-all duration-200 resize-none ${
                    errors.description
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-orange-500 hover:border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.description}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground text-sm">読書会の魅力を伝えましょう！</p>
                  <p
                    className={`text-sm font-medium ${
                      formData.description.length > 900 ? 'text-orange-600' : 'text-gray-500'
                    }`}
                  >
                    {formData.description.length}/1000文字
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-1 rounded-lg">
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                  </div>
                  <Label className="text-lg font-semibold text-gray-900 dark:text-white">
                    対象書籍（候補） 📚
                  </Label>
                </div>

                {/* 説明カード */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-500 text-white p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                        💡 書籍の決定方法について
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                        <strong>複数選択</strong>：メンバーが参加した際に<strong>投票</strong>
                        を行い、最終的に読む書籍を決定
                        <br />
                        <strong>1冊のみ選択</strong>：その書籍で読書会が確定
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 p-6 rounded-2xl">
                  {/* 選択された書籍の表示 */}
                  {formData.book_candidates.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          書籍候補 ({formData.book_candidates.length}冊)
                        </p>
                        <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>メンバー投票で決定</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {formData.book_candidates.map((book, _index) => (
                          <div
                            key={book.id}
                            className="flex items-center gap-4 p-4 border-2 border-purple-200 rounded-xl bg-white hover:bg-purple-50 cursor-pointer transition-all duration-200 hover:shadow-md group"
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
                              className="w-14 h-18 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-200 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base line-clamp-2 group-hover:text-purple-700 transition-colors">
                                {book.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">{book.author}</p>
                              <p className="text-xs text-purple-600 mt-2 font-medium">
                                クリックで削除
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 書籍が選択されていない場合の表示 */}
                  {formData.book_candidates.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-purple-300 rounded-xl bg-white/50">
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-purple-100 p-3 rounded-full">
                          <svg
                            className="w-8 h-8 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-purple-800 mb-1">
                            書籍候補を追加してください
                          </h4>
                          <p className="text-sm text-purple-600">
                            下の検索フィールドから書籍を検索して候補に追加できます
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 書籍検索フィールド */}
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
                      <Input
                        placeholder="書籍タイトルで検索... 🔍"
                        value={bookSearchQuery}
                        onChange={e => setBookSearchQuery(e.target.value)}
                        className="pl-12 h-12 text-lg rounded-xl border-2 border-purple-200 focus:border-purple-500 hover:border-purple-300 transition-all duration-200"
                      />
                    </div>

                    {/* 検索結果 */}
                    {bookSearchQuery && (
                      <div className="max-h-80 overflow-y-auto border-2 border-purple-200 rounded-xl bg-white shadow-lg">
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
                          <div className="p-3">
                            <div className="space-y-3">
                              {searchResults.map(book => (
                                <div
                                  key={book.id}
                                  className="cursor-pointer hover:bg-purple-50 p-3 rounded-xl border border-purple-100 hover:border-purple-300 transition-all duration-200 hover:shadow-md"
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
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
                                    >
                                      候補に追加 📝
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
            <div className="space-y-8">
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    開催可能な日時を選択してください 📅
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    クリックで選択・解除できます。複数の候補日時を選んでください。
                  </p>
                </div>
                {errors.schedule && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                    <p className="text-red-600 font-medium flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      {errors.schedule}
                    </p>
                  </div>
                )}

                {/* 時間グリッド */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-3xl border-2 border-blue-100 dark:border-blue-800">
                  <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                      {/* ヘッダー行 */}
                      <div className="grid grid-cols-8 gap-2 mb-4">
                        <div className="h-12"></div>
                        {DAYS_OF_WEEK.map((day, dayIndex) => (
                          <div
                            key={dayIndex}
                            className={`
                              h-12 flex items-center justify-center text-sm font-bold rounded-xl shadow-sm
                              ${
                                dayIndex === 0
                                  ? 'bg-gradient-to-r from-red-400 to-pink-400 text-white' // 日曜日
                                  : dayIndex === 6
                                    ? 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white' // 土曜日
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' // 平日
                              }
                            `}
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* 時間スロット */}
                      {HOURS.map(hour => (
                        <div key={hour} className="grid grid-cols-8 gap-2 mb-2">
                          <div className="h-10 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            {hour}:00
                          </div>
                          {DAYS_OF_WEEK.map((day, dayIndex) => (
                            <button
                              key={`${dayIndex}-${hour}`}
                              type="button"
                              onClick={() => toggleTimeSlot(dayIndex, hour)}
                              aria-label={`${day}曜日 ${hour}:00-${hour + 1}:00`}
                              className={`
                                h-10 rounded-xl text-xs font-medium transition-all duration-200 transform hover:scale-105 shadow-sm
                                ${
                                  isTimeSlotSelected(dayIndex, hour)
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-2 border-blue-400 shadow-lg'
                                    : 'bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300'
                                }
                              `}
                            >
                              {isTimeSlotSelected(dayIndex, hour) && '✓'}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1 rounded-lg">
                        <div className="w-3 h-3 bg-white rounded-sm"></div>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">Tips 💡</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      クリックしてタイムスロットを選択・解除できます。複数の候補日時を選択することで、参加者が都合の良い時間を選べます。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ステップ 3: 確認・招待 */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    入力内容の確認 🔍
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    内容を確認して、素敵な読書会を作成しましょう！
                  </p>
                </div>

                <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl border-2 border-gray-200 dark:border-gray-700">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-1 rounded-lg">
                        <div className="w-3 h-3 bg-white rounded-sm"></div>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">読書会タイトル</p>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
                      {formData.title}
                    </p>
                  </div>

                  {formData.purpose && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-green-200 dark:border-green-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-1 rounded-lg">
                          <div className="w-3 h-3 bg-white rounded-sm"></div>
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white">目的</p>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{formData.purpose}</p>
                    </div>
                  )}

                  {formData.description && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-orange-200 dark:border-orange-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-1 rounded-lg">
                          <div className="w-3 h-3 bg-white rounded-sm"></div>
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white">説明</p>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {formData.description}
                      </p>
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

              <div className="text-center">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-3" />
                      <span className="text-lg">作成中...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold">読書会を作成 🎉</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ナビゲーションボタン */}
          <div className="flex justify-between mt-10 pt-6 border-t-2 border-gray-100 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="h-12 px-6 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
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
