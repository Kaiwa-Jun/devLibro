import { Metadata } from 'next';

import BookDetail from '@/components/book/BookDetail';
import ReviewList from '@/components/book/ReviewList';
import WriteReviewButton from '@/components/book/WriteReviewButton';
import { mockBooks } from '@/lib/mock-data';

type Props = {
  params: { id: string };
};

export function generateMetadata({ params }: Props): Metadata {
  // 実際の実装では書籍データをフェッチして動的に生成
  return {
    title: `書籍詳細 | DevLibro`,
    description: `技術書の詳細情報とレビューを確認できます`,
  };
}

export const generateStaticParams = () => {
  return mockBooks.map(book => ({
    id: book.id,
  }));
};

export default function BookPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="space-y-6 pb-8 pt-2">
      <WriteReviewButton />
      <BookDetail id={id} />
      <ReviewList bookId={id} />
    </div>
  );
}
