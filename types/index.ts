export type Book = {
  id: string;
  isbn: string;
  title: string;
  author: string;
  language: string;
  categories: string[];
  img_url: string;
  avg_difficulty: number;
  description?: string;
  programmingLanguages?: string[];
  frameworks?: string[];
  publisherName?: string;
  itemUrl?: string;
};

export type User = {
  id: string;
  pen_name: string;
  experience_years: number;
};

export type Review = {
  id: string;
  user_id: string;
  user_name: string;
  book_id: string;
  difficulty: number;
  experience_years: number;
  comment: string;
  created_at: string;
  experienceLabel?: string;
  anonymous?: boolean;
};

export type UserBook = {
  id: string;
  user_id: string;
  book: Book;
  status: 'unread' | 'reading' | 'done';
  progress: number;
  added_at: string | null;
  finished_at: string | null;
};

// レコメンド機能関連の型定義
export enum ExperienceLevel {
  BEGINNER = 'beginner', // 0-2年 (未経験、1年未満、1-3年)
  INTERMEDIATE = 'intermediate', // 3-4年 (3-5年)
  EXPERT = 'expert', // 5年以上
}

export type RecommendationScore = {
  bookId: string;
  score: number;
  reasons: string[];
  avgDifficulty: number;
  reviewCount: number;
  experienceLevelMatch: number; // 同じ経験レベルのレビュー数
};

export type RecommendationWithBook = {
  book: Book;
  score: number;
  reasons: string[];
  avgDifficulty: number;
  reviewCount: number;
  experienceLevelMatch: number;
};

export type RecommendationCache = {
  experienceLevel: ExperienceLevel;
  bookId: string;
  avgDifficulty: number;
  reviewCount: number;
  sameLevelReviews: number;
  positiveRate: number;
  updatedAt: string;
};

// 輪読会機能関連の型定義
export type ReadingCircle = {
  id: string;
  title: string;
  description?: string;
  book_id: number;
  created_by: string;
  status: 'draft' | 'recruiting' | 'active' | 'completed' | 'cancelled';
  max_participants: number;
  is_private: boolean;
  start_date?: string;
  end_date?: string;
  participant_count: number;
  created_at: string;
  updated_at: string;
};

export type CircleParticipant = {
  id: string;
  circle_id: string;
  user_id: string;
  role: 'organizer' | 'participant';
  status: 'pending' | 'approved' | 'rejected' | 'left';
  joined_at?: string;
  created_at: string;
  updated_at: string;
};

export type CircleSchedule = {
  id: string;
  circle_id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  start_page?: number;
  end_page?: number;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
};

export type CircleProgress = {
  id: string;
  circle_id: string;
  user_id: string;
  current_page?: number;
  notes?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type CircleMessage = {
  id: string;
  circle_id: string;
  user_id: string;
  message: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

// ステータス判定関数
export function getCircleStatus(circle: ReadingCircle): ReadingCircle['status'] {
  // 手動でキャンセルされている場合はそのまま返す
  if (circle.status === 'cancelled') {
    return 'cancelled';
  }

  const now = new Date();

  // 開始日が設定されている場合の自動判定
  if (circle.start_date) {
    const circleStart = new Date(circle.start_date);

    // 開始日前は募集中
    if (now < circleStart) {
      return 'recruiting';
    }

    // 開始日以降で終了日が設定されている場合
    if (circle.end_date) {
      const circleEnd = new Date(circle.end_date);

      if (now >= circleStart && now <= circleEnd) {
        return 'active';
      }

      if (now > circleEnd) {
        return 'completed';
      }
    } else {
      // 終了日が設定されていない場合は開始日以降は開催中
      return 'active';
    }
  }

  // デフォルトは現在のステータスを維持
  return circle.status;
}

// ステータス表示用の情報
export const statusLabels = {
  draft: { label: '募集前', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
  recruiting: { label: '募集中', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
  active: { label: '開催中', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
  completed: { label: '終了', variant: 'outline' as const, color: 'bg-gray-100 text-gray-600' },
  cancelled: {
    label: 'キャンセル',
    variant: 'destructive' as const,
    color: 'bg-red-100 text-red-800',
  },
} as const;
