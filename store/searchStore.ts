import { create } from 'zustand';

import { Book } from '@/types';

interface SearchState {
  searchTerm: string;
  searchResults: Book[];
  isLoading: boolean;
  hasMore: boolean;
  totalItems: number;
  currentPage: number;

  setSearchTerm: (term: string) => void;
  setSearchResults: (results: Book[], replace?: boolean) => void;
  setSearchLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setTotalItems: (total: number) => void;
  incrementPage: () => void;
  resetPagination: () => void;
  clearSearch: () => void;
}

// 検索状態を管理するストア
export const useSearchStore = create<SearchState>(set => ({
  searchTerm: '',
  searchResults: [],
  isLoading: false,
  hasMore: false,
  totalItems: 0,
  currentPage: 0,

  // 検索語を設定
  setSearchTerm: term =>
    set(state => {
      // 検索語が変わった場合は状態をリセット
      if (term !== state.searchTerm) {
        return {
          searchTerm: term,
          searchResults: [],
          currentPage: 0,
          hasMore: false,
          totalItems: 0,
        };
      }
      return { searchTerm: term };
    }),

  // 検索結果を設定
  setSearchResults: (results, replace = false) =>
    set(state => ({
      searchResults: replace ? results : [...state.searchResults, ...results],
    })),

  // ローディング状態を設定
  setSearchLoading: loading => set({ isLoading: loading }),

  // さらに結果があるかどうかを設定
  setHasMore: hasMore => set({ hasMore }),

  // 合計件数を設定
  setTotalItems: totalItems => set({ totalItems }),

  // ページをインクリメント
  incrementPage: () => set(state => ({ currentPage: state.currentPage + 1 })),

  // ページネーションをリセット
  resetPagination: () => set({ currentPage: 0, hasMore: false, totalItems: 0 }),

  // 検索をクリア
  clearSearch: () =>
    set({
      searchTerm: '',
      searchResults: [],
      isLoading: false,
      hasMore: false,
      totalItems: 0,
      currentPage: 0,
    }),
}));
