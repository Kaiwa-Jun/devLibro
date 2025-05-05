'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { addReview } from '@/lib/supabase/reviews';
import { getDifficultyInfo } from '@/lib/utils';

interface ReviewModalProps {
  bookId: string;
  onClose: () => void;
}

export default function ReviewModal({ bookId, onClose }: ReviewModalProps) {
  const [difficulty, setDifficulty] = useState(3);
  const [comment, setComment] = useState('');
  const [postType, setPostType] = useState<'named' | 'anonymous'>('named');
  const [userName, setUserName] = useState('jun_kaiwa'); // 実際の実装ではログインユーザー名を設定
  const maxLength = 200;
  const { user } = useAuth();

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

      const { error } = await addReview({
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
            />
            <p className="text-sm text-muted-foreground">表示名プレビュー：{userName}</p>
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
            <Badge
              className="gap-1.5"
              style={{
                color: `var(--${getDifficultyInfo(difficulty).color})`,
                backgroundColor: `var(--${getDifficultyInfo(difficulty).color})15`,
              }}
            >
              {getDifficultyInfo(difficulty).label}
            </Badge>
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

      <Button className="w-full" onClick={handleSaveReview}>
        レビューを保存
      </Button>
    </div>
  );
}
