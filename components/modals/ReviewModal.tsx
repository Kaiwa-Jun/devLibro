'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
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

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxLength) {
      setComment(text);
    }
  };

  const handleSaveReview = async () => {
    if (!comment.trim()) return;

    try {
      // APIを呼び出す代わりにモック処理
      // 実際の実装では、ここで保存APIを呼び出す
      console.log(
        `保存するレビュー: bookId=${bookId}, difficulty=${difficulty}, comment=${comment}, userName=${postType === 'named' ? userName : '匿名'}`
      );
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('レビューを保存しました');
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      toast.error(`エラーが発生しました: ${errorMessage}`);
    }
  };

  const difficultyOptions = [1, 2, 3, 4, 5].map(level => {
    const info = getDifficultyInfo(level);
    const DifficultyIcon = info.icon;
    return {
      value: level,
      label: info.label,
      icon: DifficultyIcon,
      color: info.color,
    };
  });

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

      <div className="space-y-2">
        <Label>難易度</Label>
        <div className="flex gap-2">
          {difficultyOptions.map(option => {
            const Icon = option.icon;
            const isSelected = difficulty === option.value;
            return (
              <motion.button
                key={option.value}
                onClick={() => setDifficulty(option.value)}
                whileTap={{ scale: 0.95 }}
                className="focus:outline-none flex-1"
              >
                <Badge
                  variant={isSelected ? 'default' : 'outline'}
                  className={`w-full gap-1.5 border ${isSelected ? 'bg-background border-white/10' : 'border-white/20'}`}
                  style={{
                    color: `var(--${option.color})`,
                    backgroundColor: isSelected ? `var(--${option.color})15` : undefined,
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{option.label}</span>
                </Badge>
              </motion.button>
            );
          })}
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
