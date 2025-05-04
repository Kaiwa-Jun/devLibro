'use client';

import { motion } from 'framer-motion';
import { Info, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookByIdFromDB, saveBookToDB } from '@/lib/supabase/books';
import { getDifficultyInfo } from '@/lib/utils';
import { Book } from '@/types';

import PurchaseLinks from './PurchaseLinks';

type BookDetailProps = {
  id: string;
};

export default function BookDetail({ id }: BookDetailProps) {
  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabaseから書籍データを取得
    const fetchBook = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('書籍情報を取得します。ID:', id);
        const bookData = await getBookByIdFromDB(id);

        if (bookData) {
          console.log('取得した書籍データ:', bookData);
          setBook(bookData);
          return; // 成功したので終了
        }

        console.error('Supabaseからの書籍データ取得に失敗しました: ID =', id);
        setError(`書籍データが見つかりませんでした (ID: ${id})`);

        // セッションストレージからの復元を試みる
        try {
          const storedBook = sessionStorage.getItem(`book_${id}`);
          if (storedBook) {
            const parsedBook = JSON.parse(storedBook);
            console.log('セッションストレージから書籍を復元:', parsedBook);
            setBook(parsedBook);
            setError(null); // エラーをクリア

            // 重要: セッションストレージから取得できた場合は、
            // 詳細ページにアクセスしたということなので、必ずDBに保存する
            try {
              console.log('ユーザーが詳細ページを表示したため、書籍をDBに保存します');
              const savedBook = await saveBookToDB(parsedBook);
              if (savedBook) {
                console.log('書籍をDBに保存しました:', savedBook);
                // 新しいDBデータをセット (内部IDがあるほうが今後の参照に便利)
                setBook(savedBook);
              }
            } catch (saveError) {
              console.error('書籍のDB保存エラー:', saveError);
            }
          }
        } catch (storageError) {
          console.error('セッションストレージからの復元に失敗:', storageError);
        }
      } catch (e) {
        console.error('書籍の取得中にエラーが発生:', e);
        setError('書籍データの取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id]);

  // 書籍情報が取得できるまでローディング表示
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="h-[240px] w-[180px] flex-shrink-0" />
            <div className="space-y-4 flex-1">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // エラー発生時またはデータなしの場合のフォールバック表示
  if (!book || error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-destructive">
              <Info className="h-5 w-5" />
              <h3 className="font-medium">書籍情報の取得に失敗しました</h3>
            </div>
            {error && <p className="text-sm text-muted-foreground">{error}</p>}
            <p className="text-sm text-muted-foreground">
              お手数ですが、トップページに戻って再度お試しください。
            </p>
            <Button variant="outline" asChild>
              <Link href="/">トップページに戻る</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const difficultyInfo = getDifficultyInfo(book.avg_difficulty);
  const DifficultyIcon = difficultyInfo.icon;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-[240px] w-[180px] flex-shrink-0 mx-auto md:mx-0"
          >
            <Image
              src={book.img_url}
              alt={book.title}
              fill
              className="object-cover rounded-md"
              sizes="180px"
            />
          </motion.div>

          <div className="flex-1 space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold">{book.title}</h1>
              <p className="text-muted-foreground">{book.author}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-2"
            >
              <Badge variant="outline" className="border">
                ISBN: {book.isbn}
              </Badge>
              <Badge variant="outline" className="border">
                {book.language}
              </Badge>
              {book.categories.map(category => (
                <Badge key={category} variant="outline" className="border">
                  {category}
                </Badge>
              ))}
              <Badge
                variant="outline"
                className="gap-1.5 border"
                style={{ color: `var(--${difficultyInfo.color})` }}
              >
                <DifficultyIcon style={{ color: `var(--${difficultyInfo.color})` }} />
                <span>{difficultyInfo.label}</span>
              </Badge>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground"
            >
              {book.description}
            </motion.p>

            <PurchaseLinks isbn={book.isbn} />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  シェア
                </Button>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href="https://example.com/more" target="_blank" rel="noopener noreferrer">
                  <Info className="mr-2 h-4 w-4" />
                  詳細情報
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
