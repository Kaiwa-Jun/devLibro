import { Metadata } from 'next';

import BookDetail from '@/components/book/BookDetail';
import BookDetailTracking from '@/components/book/BookDetailTracking';
import ReviewList from '@/components/book/ReviewList';
import WriteReviewButton from '@/components/book/WriteReviewButton';
import BookJsonLd from '@/components/seo/BookJsonLd';
import { BookJsonLd as BookJsonLdType, generatePageMetadata } from '@/lib/seo/metadata';

type Props = {
  params: { id: string };
};

// 書籍の詳細を取得する関数
async function getBookDetails(id: string): Promise<BookJsonLdType> {
  try {
    // データベースから実際の書籍情報を取得
    const { getBookByIdFromDB } = await import('@/lib/supabase/books');
    const book = await getBookByIdFromDB(id);

    if (!book) {
      // 書籍が見つからない場合のデフォルト値
      return {
        title: '書籍が見つかりません',
        authors: ['不明'],
        publisher: '不明',
        publishDate: '',
        description: '指定された書籍が見つかりませんでした。',
        isbn: '',
        image: '/images/book-placeholder.png',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/${id}`,
        genre: [],
      };
    }

    return {
      title: book.title,
      authors: [book.author],
      publisher: book.publisherName || '不明',
      publishDate: '',
      description: book.description || `${book.title}の詳細情報`,
      isbn: book.isbn || '',
      image: book.img_url || '/images/book-placeholder.png',
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/${id}`,
      genre: book.frameworks || ['技術書'],
    };
  } catch (error) {
    console.error('書籍詳細の取得に失敗しました:', error);
    // エラー時のデフォルト値
    return {
      title: '書籍情報の取得に失敗しました',
      authors: ['不明'],
      publisher: '不明',
      publishDate: '',
      description: '書籍情報の取得中にエラーが発生しました。',
      isbn: '',
      image: '/images/book-placeholder.png',
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/${id}`,
      genre: [],
    };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;
  const book = await getBookDetails(id);

  return generatePageMetadata({
    title: book.title,
    description: book.description,
    path: `/book/${id}`,
    images: book.image ? [book.image] : undefined,
  });
}

// 静的生成のパラメータは一旦削除（実際のデータを使用するため）
// 本番環境では必要に応じてISRや動的レンダリングに置き換える

export default async function BookPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const book = await getBookDetails(id);

  return (
    <div className="space-y-6 pb-8 pt-2">
      {/* Google Analyticsトラッキング用コンポーネント */}
      <BookDetailTracking bookId={id} bookTitle={book.title} />

      <WriteReviewButton />
      <BookDetail id={id} />
      <ReviewList bookId={id} />

      {/* 構造化データを追加 */}
      <BookJsonLd book={book} />
    </div>
  );
}
