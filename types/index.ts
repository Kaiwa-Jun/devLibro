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
