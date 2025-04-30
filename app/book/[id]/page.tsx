import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  // 静的ビルド時はモックデータを使用
  const book = mockBooks.find(b => b.id === params.id);

  if (!book) {
    notFound();
  }

  return (
    <div className="pt-8">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <div className="relative w-full aspect-[3/4] mb-4">
                  <Image
                    src={book.img_url}
                    alt={book.title}
                    fill
                    className="object-cover rounded-md"
                    sizes="(max-width: 768px) 100vw, 300px"
                    priority
                  />
                </div>
                <div className="w-full space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">難易度: {book.avg_difficulty}/5</Badge>
                    {book.language && <Badge variant="outline">{book.language}</Badge>}
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <Button asChild className="w-full" size="sm">
                      <Link href={`https://amazon.co.jp/dp/${book.isbn}`} target="_blank">
                        Amazonで見る
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full" size="sm">
                      <Link
                        href={`https://books.rakuten.co.jp/search?sitem=${encodeURIComponent(book.title)}`}
                        target="_blank"
                      >
                        楽天ブックスで見る
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{book.title}</h1>
            <p className="text-muted-foreground mb-4">{book.author}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {book.categories.map(category => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p>{book.description}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">レビュー</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  まだレビューがありません。最初のレビューを投稿しましょう！
                </p>
                <div className="mt-4 flex justify-center">
                  <Button>レビューを書く</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
