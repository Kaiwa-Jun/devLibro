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

export default function ReviewModal() {
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

  const handleSubmit = () => {
    if (!comment.trim()) {
      toast.error('レビューコメントを入力してください');
      return;
    }

    if (postType === 'named' && !userName.trim()) {
      toast.error('ユーザー名を入力してください');
      return;
    }

    // 実際の実装ではここでAPI呼び出し
    console.log({
      difficulty,
      comment,
      userName: postType === 'anonymous' ? '匿名' : userName,
    });
    toast.success('レビューを投稿しました');

    // フォームをリセット
    setDifficulty(3);
    setComment('');
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

      <Button className="w-full" onClick={handleSubmit}>
        レビューを投稿
      </Button>
    </div>
  );
}
