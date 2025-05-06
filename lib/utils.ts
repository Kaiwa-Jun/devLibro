import { clsx, type ClassValue } from 'clsx';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Frown, Meh, Smile } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return format(date, 'yyyy年M月d日', { locale: ja });
}

export type DifficultyInfo = {
  label: string;
  icon: typeof Smile | typeof Meh | typeof Frown;
  color: string;
};

export function getDifficultyInfo(difficulty: number, context?: 'review'): DifficultyInfo {
  if (difficulty <= 0) {
    return {
      label: '不明',
      icon: Meh,
      color: 'difficulty-unknown',
    };
  } else if (difficulty < 1.5) {
    return {
      label: context === 'review' ? '簡単だった' : '簡単',
      icon: Smile,
      color: 'difficulty-easy',
    };
  } else if (difficulty < 2.5) {
    return {
      label: context === 'review' ? 'やや簡単だった' : 'やや簡単',
      icon: Smile,
      color: 'difficulty-somewhat-easy',
    };
  } else if (difficulty < 3.5) {
    return {
      label: context === 'review' ? '普通だった' : '普通',
      icon: Meh,
      color: 'difficulty-normal',
    };
  } else if (difficulty < 4.5) {
    return {
      label: context === 'review' ? 'やや難しかった' : 'やや難しい',
      icon: Frown,
      color: 'difficulty-somewhat-hard',
    };
  } else {
    return {
      label: context === 'review' ? '難しかった' : '難しい',
      icon: Frown,
      color: 'difficulty-hard',
    };
  }
}

export function getDifficultyLabel(difficulty: number, context?: 'review'): string {
  return getDifficultyInfo(difficulty, context).label;
}
