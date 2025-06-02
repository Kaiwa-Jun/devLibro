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
