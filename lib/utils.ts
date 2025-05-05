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

export function getDifficultyInfo(difficulty: number): DifficultyInfo {
  switch (difficulty) {
    case 1:
      return {
        label: 'とても簡単だった',
        icon: Smile,
        color: 'difficulty-easy',
      };
    case 2:
      return {
        label: '簡単だった',
        icon: Smile,
        color: 'difficulty-somewhat-easy',
      };
    case 3:
      return {
        label: '普通だった',
        icon: Meh,
        color: 'difficulty-normal',
      };
    case 4:
      return {
        label: '難しかった',
        icon: Frown,
        color: 'difficulty-somewhat-hard',
      };
    case 5:
      return {
        label: 'とても難しかった',
        icon: Frown,
        color: 'difficulty-hard',
      };
    default:
      return {
        label: '不明',
        icon: Meh,
        color: 'difficulty-unknown',
      };
  }
}

export function getDifficultyLabel(difficulty: number): string {
  return getDifficultyInfo(difficulty).label;
}
