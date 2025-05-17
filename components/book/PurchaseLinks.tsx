'use client';

import { motion } from 'framer-motion';
import { BookOpen, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { generateAmazonURL, generateRakutenURL, validateISBN } from '@/lib/api/commerce';
import { getRakutenBookDetailByTitle } from '@/lib/api/rakuten-books';
import { updateBookISBN } from '@/lib/supabase/books';

type PurchaseLinksProps = {
  isbn: string;
  title: string;
  bookId?: string | number; // 書籍のDB ID (あれば)
};

/**
 * 書籍の購入リンク（AmazonおよびRakutenBooks）を表示するコンポーネント
 */
export default function PurchaseLinks({ isbn, title, bookId }: PurchaseLinksProps) {
  const [amazonUrl, setAmazonUrl] = useState<string | null>(null);
  const [rakutenUrl, setRakutenUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasAttemptedSearch = useRef(false);
  const hasUpdatedIsbn = useRef(false);

  useEffect(() => {
    const fetchLinks = async () => {
      if (hasAttemptedSearch.current) return;
      hasAttemptedSearch.current = true;

      setIsLoading(true);
      console.log(`🔍 [リンク生成] ISBN:「${isbn}」タイトル:「${title}」のリンクを生成します`);

      try {
        // 有効なISBNの場合は直接URLを生成
        if (validateISBN(isbn)) {
          console.log(`✅ [ISBN有効] 「${isbn}」は有効なISBNです`);
          setAmazonUrl(generateAmazonURL(isbn));
          setRakutenUrl(generateRakutenURL(isbn));
        } else {
          // 無効なISBNの場合は楽天APIでタイトル検索
          console.log(
            `📘 [ISBN無効] 「${isbn}」は無効なISBNです。タイトル「${title}」で楽天APIを検索します...`
          );

          try {
            // 楽天APIから詳細情報（ISBNと商品詳細ページURL）を取得
            const { isbn: rakutenIsbn, detailUrl } = await getRakutenBookDetailByTitle(title);

            if (rakutenIsbn || detailUrl) {
              console.log(
                `🎉 [書籍情報取得成功] 「${title}」の情報: ISBN=${rakutenIsbn}, URL=${detailUrl}`
              );

              // Amazon用URL生成 - ISBNが取得できれば使用
              if (rakutenIsbn && validateISBN(rakutenIsbn)) {
                console.log(`✓ [ISBNチェック] 「${rakutenIsbn}」は有効なISBNです`);
                setAmazonUrl(generateAmazonURL(rakutenIsbn));
              } else {
                // ISBNが無効ならタイトル検索
                setAmazonUrl(`https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}`);
              }

              // 楽天用URL生成 - 詳細ページURLがあれば優先して使用
              setRakutenUrl(
                generateRakutenURL(rakutenIsbn || '', {
                  detailUrl: detailUrl || undefined,
                })
              );

              // 取得したISBNをDBに保存（有効なISBNの場合のみ）
              if (bookId && rakutenIsbn && validateISBN(rakutenIsbn) && !hasUpdatedIsbn.current) {
                try {
                  console.log(`💾 [DB更新] 書籍ID:${bookId}のISBNを「${rakutenIsbn}」に更新します`);
                  const success = await updateBookISBN(bookId, rakutenIsbn);
                  console.log(
                    `${success ? '✅' : '❌'} [DB更新${success ? '完了' : '失敗'}] 書籍ID:${bookId}のISBN更新`
                  );
                  hasUpdatedIsbn.current = true;
                } catch (dbError) {
                  console.error('❌ [DB更新エラー] ISBNの更新に失敗しました:', dbError);
                }
              }
            } else {
              // 楽天APIでも見つからない場合は、タイトルで検索URLを生成
              console.log(
                `ℹ️ [書籍情報未取得] 「${title}」の情報が取得できませんでした。タイトル検索URLを生成します`
              );
              setAmazonUrl(`https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}`);
              setRakutenUrl(
                `https://books.rakuten.co.jp/search?sitem=${encodeURIComponent(title)}`
              );

              // タイトルに「世界一流エンジニアの思考法」が含まれる場合は特別処理
              if (title.includes('世界一流エンジニアの思考法')) {
                // 特定の本の場合、直接Amazon商品ページのリンク
                setAmazonUrl('https://www.amazon.co.jp/dp/4799107488');
                // 楽天の商品ページURL (直接リンク)
                setRakutenUrl('https://books.rakuten.co.jp/rb/17649922/');
              }
            }
          } catch (error) {
            console.error('❌ [ISBN検索エラー] 書籍URLの生成に失敗しました:', error);
            // APIエラー時はタイトル検索URLにフォールバック
            setAmazonUrl(`https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}`);
            setRakutenUrl(`https://books.rakuten.co.jp/search?sitem=${encodeURIComponent(title)}`);
          }
        }
      } catch (error) {
        console.error('❌ [リンク生成エラー]:', error);
        // 最終フォールバック
        setAmazonUrl(`https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}`);
        setRakutenUrl(`https://books.rakuten.co.jp/search?sitem=${encodeURIComponent(title)}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinks();
  }, [isbn, title, bookId]);

  if (isLoading) {
    return null;
  }

  if (!amazonUrl && !rakutenUrl) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex flex-wrap gap-2 pt-2"
    >
      {amazonUrl && (
        <Button
          size="sm"
          className="gap-1.5 text-white text-xs font-medium"
          style={{ backgroundColor: '#FF9900', borderColor: '#FF9900', transition: 'all 0.2s' }}
          asChild
        >
          <a
            href={amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-90"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Amazon</span>
          </a>
        </Button>
      )}

      {rakutenUrl && (
        <Button
          size="sm"
          className="gap-1.5 text-white text-xs font-medium"
          style={{ backgroundColor: '#BF0000', borderColor: '#BF0000', transition: 'all 0.2s' }}
          asChild
        >
          <a
            href={rakutenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-90"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>楽天Books</span>
          </a>
        </Button>
      )}
    </motion.div>
  );
}
