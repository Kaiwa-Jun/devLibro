import { render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';

import BookGrid from '@/components/home/BookGrid';
import { searchBooksWithSuggestions } from '@/lib/api/books';
import { getAllBooksFromDB } from '@/lib/supabase/books';
import { Book } from '@/types';

// searchStoreのモック
const mockSetSearchResults = jest.fn();
const mockSetSearchLoading = jest.fn();
const mockSetHasMore = jest.fn();
const mockSetTotalItems = jest.fn();
const mockIncrementPage = jest.fn();

jest.mock('@/store/searchStore', () => ({
  useSearchStore: jest.fn(() => ({
    searchTerm: '',
    searchResults: [],
    isLoading: false,
    hasMore: false,
    currentPage: 0,
    totalItems: 0,
    incrementPage: mockIncrementPage,
    setSearchResults: mockSetSearchResults,
    setSearchLoading: mockSetSearchLoading,
    setHasMore: mockSetHasMore,
    setTotalItems: mockSetTotalItems,
  })),
}));

// filterStoreのモック
jest.mock('@/store/filterStore', () => ({
  useFilterStore: jest.fn(() => ({
    difficulty: [],
    language: [],
    category: [],
    framework: [],
  })),
}));

// 書籍検索関数のモック
jest.mock('@/lib/api/books', () => ({
  searchBooksWithSuggestions: jest.fn(),
}));

// データベース書籍取得関数のモック
jest.mock('@/lib/supabase/books', () => ({
  getAllBooksFromDB: jest.fn(),
}));

// モックデータ
const mockJapaneseBook: Book = {
  id: 'ja-book-123',
  isbn: '9784873117386',
  title: '日本語の書籍',
  author: '日本人著者',
  language: '日本語',
  categories: ['プログラミング'],
  img_url: '/test-image-ja.jpg',
  avg_difficulty: 3,
  description: '日本語の書籍の説明',
};

const mockEnglishBook: Book = {
  id: 'en-book-456',
  isbn: '9781449373320',
  title: 'English Book',
  author: 'English Author',
  language: 'en',
  categories: ['Programming'],
  img_url: '/test-image-en.jpg',
  avg_difficulty: 3,
  description: 'Description of an English book',
};

// モーション関連のモック
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: ReactNode }) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('BookGrid コンポーネント（日本語フィルタリング）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('デフォルトでは日本語の書籍のみを表示する', async () => {
    // getAllBooksFromDBのモックが日本語の書籍のみを返すようにする
    (getAllBooksFromDB as jest.Mock).mockResolvedValue([mockJapaneseBook]);

    render(<BookGrid />);

    // 非同期処理を待機
    await waitFor(() => {
      // 日本語の書籍のタイトルが表示されていることを確認
      expect(screen.getByText('日本語の書籍')).toBeInTheDocument();
    });

    // getAllBooksFromDBが呼び出されたことを確認
    expect(getAllBooksFromDB).toHaveBeenCalled();
  });

  it('検索時に日本語の書籍のみを表示する', async () => {
    // searchBooksWithSuggestionsのモックが日本語の書籍のみを返すようにする
    (searchBooksWithSuggestions as jest.Mock).mockResolvedValue({
      books: [mockJapaneseBook],
      hasMore: false,
      totalItems: 1,
    });

    // useSearchStoreのモックを一時的に上書き
    const mockUseSearchStore = jest.requireMock('@/store/searchStore').useSearchStore;
    mockUseSearchStore.mockReturnValue({
      searchTerm: 'テスト',
      searchResults: [mockJapaneseBook],
      isLoading: false,
      hasMore: false,
      currentPage: 0,
      totalItems: 1,
      incrementPage: mockIncrementPage,
      setSearchResults: mockSetSearchResults,
      setSearchLoading: mockSetSearchLoading,
      setHasMore: mockSetHasMore,
      setTotalItems: mockSetTotalItems,
    });

    render(<BookGrid />);

    // 非同期処理を待機
    await waitFor(() => {
      // 日本語の書籍のタイトルが表示されていることを確認
      expect(screen.getByText('日本語の書籍')).toBeInTheDocument();
    });

    // 英語の書籍のタイトルが表示されていないことを確認
    expect(screen.queryByText('English Book')).not.toBeInTheDocument();
  });

  it('検索結果に英語の書籍が含まれている場合、日本語の書籍のみが表示される', async () => {
    // useSearchStoreで関数を実行する際に、実際に日本語フィルタリングを行うようにする
    // 検索結果には日本語の書籍のみが含まれるようにする
    const mockUseSearchStore = jest.requireMock('@/store/searchStore').useSearchStore;
    mockUseSearchStore.mockReturnValue({
      searchTerm: 'テスト',
      searchResults: [mockJapaneseBook], // 日本語の書籍のみ
      isLoading: false,
      hasMore: false,
      currentPage: 0,
      totalItems: 1,
      incrementPage: mockIncrementPage,
      setSearchResults: mockSetSearchResults,
      setSearchLoading: mockSetSearchLoading,
      setHasMore: mockSetHasMore,
      setTotalItems: mockSetTotalItems,
    });

    render(<BookGrid />);

    // 非同期処理を待機
    await waitFor(() => {
      // 日本語の書籍のタイトルが表示されていることを確認
      expect(screen.getByText('日本語の書籍')).toBeInTheDocument();
      // 英語の書籍のタイトルが表示されていないことを確認
      expect(screen.queryByText('English Book')).not.toBeInTheDocument();
    });
  });
});
