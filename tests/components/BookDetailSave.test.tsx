import { render, screen, waitFor } from '@testing-library/react';

import BookDetail from '@/components/book/BookDetail';
import * as booksApi from '@/lib/supabase/books';
import { Book } from '@/types';

// WriteReviewButtonをモック
jest.mock('@/components/book/WriteReviewButton', () => {
  return {
    __esModule: true,
    default: ({ bookId: _bookId }: { bookId: string }) => (
      <div data-testid="mock-review-button">レビュー投稿</div>
    ),
  };
});

// BookDetailコンポーネントのモックを削除して単純化

// APIモックの設定
jest.mock('@/lib/supabase/books', () => ({
  getBookByIdFromDB: jest.fn(),
  saveBookToDB: jest.fn(),
}));

// framer-motionのモック
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      initial: _initial,
      animate: _animate,
      transition: _transition,
    }: {
      children: React.ReactNode;
      className?: string;
      initial?: Record<string, unknown>;
      animate?: Record<string, unknown>;
      transition?: Record<string, unknown>;
    }) => <div className={className}>{children}</div>,
    p: ({
      children,
      className,
      initial: _initial,
      animate: _animate,
      transition: _transition,
    }: {
      children: React.ReactNode;
      className?: string;
      initial?: Record<string, unknown>;
      animate?: Record<string, unknown>;
      transition?: Record<string, unknown>;
    }) => <p className={className}>{children}</p>,
  },
}));

// next/imageのモック
// eslint-disable-next-line @next/next/no-img-element
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string; className?: string; fill?: boolean }) => {
    // booleanのfill属性を扱うため、残りのpropsとfillを分離する
    const { fill, ...restProps } = props;
    // データ属性としてfillの値を渡す（必要な場合）
    const dataAttrs = fill ? { 'data-fill': 'true' } : {};
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...restProps} {...dataAttrs} alt={props.alt || ''} />;
  },
}));

// next/linkのモック
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('BookDetail Component - DB保存機能', () => {
  // モックデータ
  const mockBook: Book = {
    id: 'test123',
    title: 'テスト書籍',
    author: 'テスト著者',
    isbn: '9784798142470',
    img_url: '/test-image.jpg',
    language: '日本語',
    categories: ['プログラミング', 'テスト'],
    description: 'これはテスト用の書籍です',
    avg_difficulty: 3,
  };

  beforeEach(() => {
    // モックの初期化
    jest.clearAllMocks();

    // セッションストレージのモック
    const mockSessionStorage: { [key: string]: string } = {};
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn((key: string) => mockSessionStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockSessionStorage[key];
        }),
        clear: jest.fn(() => {
          Object.keys(mockSessionStorage).forEach(key => {
            delete mockSessionStorage[key];
          });
        }),
      },
      writable: true,
    });
  });

  it('DBに書籍がない場合、セッションストレージから復元して保存する', async () => {
    // DBから書籍が見つからない状態をシミュレート
    (booksApi.getBookByIdFromDB as jest.Mock).mockResolvedValue(null);

    // セッションストレージに書籍データを保存
    window.sessionStorage.setItem(`book_${mockBook.id}`, JSON.stringify(mockBook));

    // 保存API成功を模擬
    (booksApi.saveBookToDB as jest.Mock).mockResolvedValue({ ...mockBook, internal_id: 123 });

    // コンポーネントをレンダリング
    render(<BookDetail id={mockBook.id} />);

    // ロード中の表示が消えるのを待機
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
    });

    // 書籍タイトルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('テスト書籍')).toBeInTheDocument();
    });

    // DBからの取得が試みられたことを確認
    expect(booksApi.getBookByIdFromDB).toHaveBeenCalledWith(mockBook.id);

    // セッションストレージからの復元後にDB保存が呼ばれたことを確認
    expect(booksApi.saveBookToDB).toHaveBeenCalled();

    // DB保存時にプログラミング言語とフレームワークが空配列で初期化されていることを確認
    const savedBook = (booksApi.saveBookToDB as jest.Mock).mock.calls[0][0];
    expect(savedBook).toHaveProperty('programming_languages', []);
    expect(savedBook).toHaveProperty('frameworks', []);
  });

  it('DBに書籍が既にある場合は、追加の保存処理が実行されない', async () => {
    // DBから書籍が見つかる状態をシミュレート
    (booksApi.getBookByIdFromDB as jest.Mock).mockResolvedValue({
      ...mockBook,
      internal_id: 123,
    });

    // コンポーネントをレンダリング
    render(<BookDetail id={mockBook.id} />);

    // ロード中の表示が消えるのを待機
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
    });

    // 書籍タイトルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('テスト書籍')).toBeInTheDocument();
    });

    // DBからの取得が試みられたことを確認
    expect(booksApi.getBookByIdFromDB).toHaveBeenCalledWith(mockBook.id);

    // 既にDBにある場合は、saveBookToDBが呼ばれないことを確認
    expect(booksApi.saveBookToDB).not.toHaveBeenCalled();
  });

  it('書籍データにprogramming_languagesとframeworksが既に含まれている場合、そのまま保存される', async () => {
    // DBから書籍が見つからない状態をシミュレート
    (booksApi.getBookByIdFromDB as jest.Mock).mockResolvedValue(null);

    // 言語とフレームワーク情報を含む書籍データ
    const bookWithLang = {
      ...mockBook,
      programming_languages: ['JavaScript', 'TypeScript'],
      frameworks: ['React', 'Next.js'],
    };

    // セッションストレージに書籍データを保存
    window.sessionStorage.setItem(`book_${mockBook.id}`, JSON.stringify(bookWithLang));

    // 保存API成功を模擬
    (booksApi.saveBookToDB as jest.Mock).mockResolvedValue({ ...bookWithLang, internal_id: 123 });

    // コンポーネントをレンダリング
    render(<BookDetail id={mockBook.id} />);

    // ロード中の表示が消えるのを待機
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
    });

    // DB保存が呼ばれることを確認
    expect(booksApi.saveBookToDB).toHaveBeenCalled();

    // 既存の言語とフレームワーク情報が保持されていることを確認
    const savedBook = (booksApi.saveBookToDB as jest.Mock).mock.calls[0][0];
    expect(savedBook.programming_languages).toEqual(['JavaScript', 'TypeScript']);
    expect(savedBook.frameworks).toEqual(['React', 'Next.js']);
  });

  it('保存済みフラグがある場合は、DB保存処理がスキップされる', async () => {
    // DBから書籍が見つからない状態をシミュレート
    (booksApi.getBookByIdFromDB as jest.Mock).mockResolvedValue(null);

    // セッションストレージに書籍データを保存
    window.sessionStorage.setItem(`book_${mockBook.id}`, JSON.stringify(mockBook));

    // 保存済みフラグを設定
    window.sessionStorage.setItem(`book_${mockBook.id}_saved`, 'true');

    // コンポーネントをレンダリング
    render(<BookDetail id={mockBook.id} />);

    // ロード中の表示が消えるのを待機
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
    });

    // 書籍タイトルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('テスト書籍')).toBeInTheDocument();
    });

    // DBからの取得が試みられたことを確認
    expect(booksApi.getBookByIdFromDB).toHaveBeenCalledWith(mockBook.id);

    // 保存済みフラグがあるため、saveBookToDBが呼ばれないことを確認
    expect(booksApi.saveBookToDB).not.toHaveBeenCalled();
  });

  it('pendingフラグがある場合は、DB保存処理が実行される', async () => {
    // DBから書籍が見つからない状態をシミュレート
    (booksApi.getBookByIdFromDB as jest.Mock).mockResolvedValue(null);

    // セッションストレージに書籍データを保存
    window.sessionStorage.setItem(`book_${mockBook.id}`, JSON.stringify(mockBook));

    // pending（処理中）フラグを設定
    window.sessionStorage.setItem(`book_${mockBook.id}_saved`, 'pending');

    // 保存API成功を模擬
    (booksApi.saveBookToDB as jest.Mock).mockResolvedValue({ ...mockBook, internal_id: 123 });

    // コンポーネントをレンダリング
    render(<BookDetail id={mockBook.id} />);

    // ロード中の表示が消えるのを待機
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
    });

    // 書籍タイトルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('テスト書籍')).toBeInTheDocument();
    });

    // pendingフラグがある場合は、保存処理が再試行されることを確認
    expect(booksApi.saveBookToDB).toHaveBeenCalled();

    // 処理完了後、保存済みフラグが'true'に設定されることを確認
    await waitFor(() => {
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        `book_${mockBook.id}_saved`,
        'true'
      );
    });
  });

  it('useRef経由でStrictModeによる二重マウントを防止する', async () => {
    // DBから書籍が見つからない状態をシミュレート
    (booksApi.getBookByIdFromDB as jest.Mock).mockResolvedValue(null);

    // セッションストレージに書籍データを保存
    window.sessionStorage.setItem(`book_${mockBook.id}`, JSON.stringify(mockBook));

    // 保存API成功を模擬
    (booksApi.saveBookToDB as jest.Mock).mockResolvedValue({ ...mockBook, internal_id: 123 });

    // コンポーネントをレンダリング
    const { rerender } = render(<BookDetail id={mockBook.id} />);

    // ロード中の表示が消えるのを待機
    await waitFor(() => {
      expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument();
    });

    // 書籍タイトルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('テスト書籍')).toBeInTheDocument();
    });

    // 最初のレンダリングでDB保存が呼ばれたことを確認
    expect(booksApi.saveBookToDB).toHaveBeenCalledTimes(1);

    // StrictModeをシミュレートするために同じコンポーネントを再レンダリング
    jest.clearAllMocks(); // APIコールをリセット
    rerender(<BookDetail id={mockBook.id} />);

    // 再レンダリング後も処理が実行されないことを確認（useRefによる二重実行防止）
    await waitFor(() => {
      expect(booksApi.saveBookToDB).not.toHaveBeenCalled();
    });
  });
});
