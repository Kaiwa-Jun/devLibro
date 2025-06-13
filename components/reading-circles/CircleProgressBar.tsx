'use client';

import { Progress } from '@/components/ui/progress';

interface CircleProgressBarProps {
  currentProgress: number;
  totalPages?: number;
  className?: string;
}

export function CircleProgressBar({
  currentProgress,
  totalPages = 100,
  className = '',
}: CircleProgressBarProps) {
  const progressPercentage = Math.min(Math.max((currentProgress / totalPages) * 100, 0), 100);

  return (
    <div className={`space-y-1 ${className}`}>
      <Progress value={progressPercentage} className="h-2" />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{Math.round(progressPercentage)}% 完了</span>
        <span>
          {currentProgress}/{totalPages}ページ
        </span>
      </div>
    </div>
  );
}
