import { render, screen } from '@testing-library/react';

import BookCard from '@/components/home/BookCard';
import { Book } from '@/types';

// モックの設定
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img src={props.src} alt={props.alt} className={props.className} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: (props: any) => {
    return <a href={props.href}>{props.children}</a>;
  },
}));

// フレーマーモーションのモック
jest.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => {
      return <div className={props.className}>{props.children}</div>;
    },
  },
}));

describe('BookCard Component', () => {
  const mockBook: Book = {
    id: '1',
    title: 'テスト書籍',
    author: 'テスト著者',
    isbn: '1234567890123',
    img_url: '/test-image.jpg',
    language: 'ja',
    categories: ['プログラミング', 'Web開発'],
    avg_difficulty: 3,
  };

  it('renders book information correctly', () => {
    render(<BookCard book={mockBook} />);

    // タイトルと著者の確認
    expect(screen.getByText('テスト書籍')).toBeInTheDocument();
    expect(screen.getByText('テスト著者')).toBeInTheDocument();

    // 画像の確認
    const image = screen.getByAltText('テスト書籍');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');

    // 難易度表示の確認
    expect(screen.getByText('普通')).toBeInTheDocument();
  });

  it('renders correct difficulty badge for different levels', () => {
    const easyBook = { ...mockBook, avg_difficulty: 1 };
    const { rerender } = render(<BookCard book={easyBook} />);

    expect(screen.getByText('簡単')).toBeInTheDocument();

    const hardBook = { ...mockBook, avg_difficulty: 5 };
    rerender(<BookCard book={hardBook} />);

    expect(screen.getByText('難しい')).toBeInTheDocument();

    const unknownBook = { ...mockBook, avg_difficulty: 0 };
    rerender(<BookCard book={unknownBook} />);

    expect(screen.getByText('不明')).toBeInTheDocument();
  });
});
