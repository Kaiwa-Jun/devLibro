import { create } from 'zustand';

import { Book } from '@/types';

interface SearchState {
  searchTerm: string;
  searchResults: Book[];
  isLoading: boolean;
  setSearchTerm: (term: string) => void;
  setSearchResults: (results: Book[]) => void;
  setSearchLoading: (loading: boolean) => void;
  clearSearch: () => void;
}

// 検索状態を管理するストア
export const useSearchStore = create<SearchState>(set => ({
  searchTerm: '',
  searchResults: [],
  isLoading: false,

  // 検索語を設定
  setSearchTerm: term => set({ searchTerm: term }),

  // 検索結果を設定
  setSearchResults: results => set({ searchResults: results }),

  // ローディング状態を設定
  setSearchLoading: loading => set({ isLoading: loading }),

  // 検索をクリア
  clearSearch: () => set({ searchTerm: '', searchResults: [], isLoading: false }),
}));
