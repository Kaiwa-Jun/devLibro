import { create } from 'zustand';

interface FilterState {
  difficulty: string[];
  language: string[];
  category: string[];

  setDifficultyFilter: (difficulties: string[]) => void;
  setLanguageFilter: (languages: string[]) => void;
  setCategoryFilter: (categories: string[]) => void;
  addFilter: (type: 'difficulty' | 'language' | 'category', value: string) => void;
  removeFilter: (type: 'difficulty' | 'language' | 'category', value: string) => void;
  clearFilters: () => void;
  clearFiltersByType: (type: 'difficulty' | 'language' | 'category') => void;
}

export const useFilterStore = create<FilterState>(set => ({
  difficulty: [],
  language: [],
  category: [],

  setDifficultyFilter: difficulties => set({ difficulty: difficulties }),
  setLanguageFilter: languages => set({ language: languages }),
  setCategoryFilter: categories => set({ category: categories }),

  addFilter: (type, value) =>
    set(state => {
      // 言語の場合は大文字小文字を区別しないように特別処理
      if (type === 'language') {
        const isAlreadyIncluded = state.language.some(
          item => item.toLowerCase() === value.toLowerCase()
        );
        if (isAlreadyIncluded) {
          return state; // 既に存在する場合は何もしない
        }
        return { language: [...state.language, value] };
      }

      // 難易度とカテゴリの場合は元の処理
      return {
        [type]: state[type].includes(value) ? state[type] : [...state[type], value],
      };
    }),

  removeFilter: (type, value) =>
    set(state => {
      // 言語の場合は大文字小文字を区別しないように特別処理
      if (type === 'language') {
        return {
          language: state.language.filter(item => item.toLowerCase() !== value.toLowerCase()),
        };
      }

      // 難易度とカテゴリの場合は元の処理
      return {
        [type]: state[type].filter(item => item !== value),
      };
    }),

  clearFilters: () => set({ difficulty: [], language: [], category: [] }),

  clearFiltersByType: type =>
    set(state => ({
      [type]: [],
    })),
}));
