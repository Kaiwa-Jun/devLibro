'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { REVIEW_ADDED, reviewEvents } from '@/lib/events/reviewEvents';
import { getUserProfile } from '@/lib/supabase/client';
import { addReview } from '@/lib/supabase/reviews';
import { getDifficultyInfo } from '@/lib/utils';
import { truncateUserName } from '@/lib/utils/truncate';

interface ReviewModalProps {
  bookId: string;
  onClose: () => void;
}

export default function ReviewModal({ bookId, onClose }: ReviewModalProps) {
  const [difficulty, setDifficulty] = useState(3);
  const [comment, setComment] = useState('');
  const [postType, setPostType] = useState<'named' | 'anonymous'>('named');
  const [userName, setUserName] = useState('');
  const maxLength = 200;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // ユーザープロフィール情報の取得
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // ユーザー名の初期設定
        const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー';
        setUserName(displayName);

        // Supabaseからプロフィール情報を取得
        const { data, error } = await getUserProfile(user.id);
        if (error) {
          console.error('プロフィール取得エラー:', error);
          return;
        }

        // プロフィール情報があれば反映
        if (data && data.display_name) {
          setUserName(String(data.display_name));
        }
      } catch (error) {
        console.error('プロフィール取得中にエラーが発生しました:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxLength) {
      setComment(text);
    } else {
      // 最大文字数を超える場合は切り詰める
      setComment(text.slice(0, maxLength));
    }
  };

  const handleSaveReview = async () => {
    if (!user) {
      toast.error('レビューを投稿するにはログインしてください');
      return;
    }

    if (!comment.trim()) {
      toast.error('コメントを入力してください');
      return;
    }

    try {
      const displayType = postType === 'named' ? 'custom' : 'anon';

      const { data, error } = await addReview({
        bookId,
        userId: user.id,
        difficulty,
        comment,
        displayType,
        customPenName: postType === 'named' ? userName : undefined,
      });

      if (error) {
        console.error('レビュー保存中にエラーが発生しました:', error);

        // エラーメッセージの内容によって適切なメッセージを表示
        const errorMsg =
          typeof error === 'object' && error !== null && 'message' in error
            ? String(error.message)
            : 'レビュー保存中にエラーが発生しました';

        // 特定のエラーメッセージを分かりやすく表示
        if (errorMsg.includes('すでにこの書籍のレビュー')) {
          toast.error('すでにこの書籍のレビューを投稿しています');
        } else if (errorMsg.includes('該当する書籍が見つかり')) {
          toast.error('該当する書籍が見つかりません');
        } else if (
          errorMsg.includes('duplicate key value') ||
          errorMsg.includes('unique constraint')
        ) {
          toast.error('すでにこの書籍のレビューを投稿しています');
        } else {
          toast.error(`エラーが発生しました: ${errorMsg}`);
        }
        return;
      }

      toast.success('レビューを保存しました');

      // レビュー追加イベントを発行
      reviewEvents.emit(REVIEW_ADDED, { bookId });

      onClose();
    } catch (error: unknown) {
      console.error('レビュー保存中に例外が発生しました:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      toast.error(`エラーが発生しました: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <Label>投稿者名</Label>
        <RadioGroup
          value={postType}
          onValueChange={value => setPostType(value as 'named' | 'anonymous')}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="named" id="named" />
            <Label htmlFor="named">表示名で投稿</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="anonymous" id="anonymous" />
            <Label htmlFor="anonymous">匿名で投稿</Label>
          </div>
        </RadioGroup>

        {postType === 'named' && (
          <div className="space-y-2">
            <Input
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="表示名を入力"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              {isLoading ? '読み込み中...' : `表示名プレビュー：${truncateUserName(userName)}`}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Label>難易度</Label>
        <div className="space-y-6">
          <Slider
            value={[difficulty]}
            onValueChange={value => setDifficulty(value[0])}
            min={1}
            max={5}
            step={1}
            className="my-4"
          />
          <div className="flex justify-center">
            <div
              className={`text-xs py-0.5 px-2 rounded-full whitespace-nowrap w-fit min-w-[4rem] font-medium flex items-center justify-center border ${
                getDifficultyInfo(difficulty, 'review').color === 'difficulty-easy'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : getDifficultyInfo(difficulty, 'review').color === 'difficulty-somewhat-easy'
                    ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                    : getDifficultyInfo(difficulty, 'review').color === 'difficulty-normal'
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : getDifficultyInfo(difficulty, 'review').color === 'difficulty-somewhat-hard'
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : getDifficultyInfo(difficulty, 'review').color === 'difficulty-hard'
                          ? 'bg-purple-50 text-purple-600 border-purple-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {getDifficultyInfo(difficulty, 'review').label}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="comment">コメント</Label>
          <span className="text-xs text-muted-foreground">
            {comment.length}/{maxLength}
          </span>
        </div>
        <Textarea
          id="comment"
          placeholder="書籍の感想や難易度についてのコメントを書いてください"
          value={comment}
          onChange={handleCommentChange}
          rows={5}
          className="resize-none"
        />
      </div>

      <Button className="w-full" onClick={handleSaveReview} disabled={isLoading}>
        レビューを保存
      </Button>
    </div>
  );
}
