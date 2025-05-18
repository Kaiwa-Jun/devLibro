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

// 書籍の詳細を取得する関数（実際のアプリでは適切なデータ取得ロジックを実装）
async function getBookDetails(id: string): Promise<BookJsonLdType> {
  // この例では静的なデータを返しています
  // 実際のアプリでは、データベースから書籍情報を取得します
  return {
    title: `技術書タイトル${id}`,
    authors: ['著者名1', '著者名2'],
    publisher: '出版社名',
    publishDate: '2023-01-15',
    description: `技術書${id}の詳細な説明文がここに入ります。この本は開発者向けの実践的な内容を提供しています。`,
    isbn: `978-4-xxxx-xxxx-${id}`,
    image: `/books/book${id}.jpg`,
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/${id}`,
    genre: ['プログラミング', '技術書'],
  };
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
