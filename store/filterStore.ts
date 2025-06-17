import { create } from 'zustand';

interface FilterState {
  difficulty: string[];
  language: string[];
  category: string[];
  framework: string[];

  setDifficultyFilter: (difficulties: string[]) => void;
  setLanguageFilter: (languages: string[]) => void;
  setCategoryFilter: (categories: string[]) => void;
  setFrameworkFilter: (frameworks: string[]) => void;
  addFilter: (type: 'difficulty' | 'language' | 'category' | 'framework', value: string) => void;
  removeFilter: (type: 'difficulty' | 'language' | 'category' | 'framework', value: string) => void;
  clearFilters: () => void;
  clearFiltersByType: (type: 'difficulty' | 'language' | 'category' | 'framework') => void;
}

export const useFilterStore = create<FilterState>(set => ({
  difficulty: [],
  language: [],
  category: [],
  framework: [],

  setDifficultyFilter: difficulties => set({ difficulty: difficulties }),
  setLanguageFilter: languages => set({ language: languages }),
  setCategoryFilter: categories => set({ category: categories }),
  setFrameworkFilter: frameworks => set({ framework: frameworks }),

  addFilter: (type, value) =>
    set(state => {
      // 言語とフレームワークの場合は大文字小文字を区別しないように特別処理
      if (type === 'language' || type === 'framework') {
        const targetArray = state[type];
        const isAlreadyIncluded = targetArray.some(
          item => item.toLowerCase() === value.toLowerCase()
        );
        if (isAlreadyIncluded) {
          return state; // 既に存在する場合は何もしない
        }
        return { [type]: [...targetArray, value] };
      }

      // 難易度とカテゴリの場合は元の処理
      return {
        [type]: state[type].includes(value) ? state[type] : [...state[type], value],
      };
    }),

  removeFilter: (type, value) =>
    set(state => {
      // 言語とフレームワークの場合は大文字小文字を区別しないように特別処理
      if (type === 'language' || type === 'framework') {
        return {
          [type]: state[type].filter(item => item.toLowerCase() !== value.toLowerCase()),
        };
      }

      // 難易度とカテゴリの場合は元の処理
      return {
        [type]: state[type].filter(item => item !== value),
      };
    }),

  clearFilters: () => set({ difficulty: [], language: [], category: [], framework: [] }),

  clearFiltersByType: _type =>
    set(_state => {
      const newState = { difficulty: [], language: [], category: [], framework: [] };
      return newState;
    }),
}));
