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
