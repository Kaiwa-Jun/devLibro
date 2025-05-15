'use client';

import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  formatASIN,
  generateAmazonDirectURL,
  generateAmazonURL,
  generateAmazonURLFromASIN,
  generateRakutenSearchURL,
  generateRakutenURL,
  validateISBN,
} from '@/lib/api/commerce';

type PurchaseLinksProps = {
  isbn: string;
  title?: string;
  author?: string;
  googleBooksId?: string;
};

/**
 * 書籍の購入リンク（AmazonおよびRakutenBooks）を表示するコンポーネント
 */
export default function PurchaseLinks({ isbn, title, author, googleBooksId }: PurchaseLinksProps) {
  console.log('PurchaseLinks受け取ったISBN:', isbn);
  console.log('PurchaseLinks受け取ったタイトル:', title);
  console.log('PurchaseLinks受け取ったID:', googleBooksId);

  // 変数でリンクの種類を記録（検索用アイコンの表示のみに使用）
  let isAmazonSearch = false;
  let isRakutenSearch = false;

  // リンク変数を初期化
  let amazonUrl: string | null = null;
  let rakutenUrl: string | null = null;

  // 特定のパターンの場合は常にタイトル検索を使用
  const forceUseSearch =
    googleBooksId?.includes('EAAAQBAJ') || // Google BooksID
    isbn === 'B101900209' || // 特定のASINパターン
    isbn?.length !== 10 || // ISBNやASINは10桁
    (isbn && /^B\d{9}$/.test(isbn)) || // B + 9桁の数字パターン
    ['B101900209', 'B0001', 'SNN-EAAAQBAJ'].includes(isbn || ''); // その他の特別パターン

  // タイトルがある場合は、検索URLを常に優先的に生成
  if (title && (forceUseSearch || !validateISBN(isbn || ''))) {
    amazonUrl = generateAmazonDirectURL(title, author);
    isAmazonSearch = true;
    console.log('タイトルからAmazon検索URLを生成:', amazonUrl);

    rakutenUrl = generateRakutenSearchURL(title, author);
    isRakutenSearch = true;
    console.log('タイトルから楽天検索URLを生成:', rakutenUrl);
  }
  // タイトルがない場合、または特別なパターンに該当しないかつISBNが有効な場合はISBN/ASINベースのURLを使用
  else {
    // 1. まずISBNベースでリンクを生成
    amazonUrl = generateAmazonURL(isbn);
    rakutenUrl = generateRakutenURL(isbn);

    console.log('ISBNからのAmazonURL生成結果:', amazonUrl);
    console.log('ISBNからの楽天URL生成結果:', rakutenUrl);

    // 2. ISBNが無効でamazonUrlが生成できない場合はASINとして処理
    if (!amazonUrl && isbn && !validateISBN(isbn)) {
      console.log('ISBNが無効なのでASINとして処理します:', isbn);

      // ASINを適切にフォーマット
      const asin = formatASIN(isbn);
      console.log('フォーマット後のASIN:', asin);

      // ASINからAmazonURLを生成
      amazonUrl = generateAmazonURLFromASIN(asin);
      console.log(`ASINとしてAmazonリンクを生成: ${asin} -> ${amazonUrl}`);

      // タイトルがあって、ASINからのURL生成に失敗した場合は検索を使用
      if (!amazonUrl && title) {
        amazonUrl = generateAmazonDirectURL(title, author);
        isAmazonSearch = true;
        console.log('ASINからのURL生成失敗、タイトル検索URLに切り替え:', amazonUrl);
      }
    }

    // 楽天URLがなくてタイトルがある場合
    if (!rakutenUrl && title) {
      rakutenUrl = generateRakutenSearchURL(title, author);
      isRakutenSearch = true;
      console.log('ISBNからの楽天URL生成失敗、タイトル検索URLに切り替え:', rakutenUrl);
    }
  }

  // URLをデバッグ表示
  console.log('最終的に表示するリンク - Amazon:', amazonUrl);
  console.log('最終的に表示するリンク - 楽天:', rakutenUrl);

  // リンクが生成できなかった場合のフォールバック処理
  if (!amazonUrl && !rakutenUrl) {
    console.log('リンクを生成できませんでした');
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
            {isAmazonSearch ? (
              <Search className="h-3.5 w-3.5" />
            ) : (
              <ExternalLink className="h-3.5 w-3.5" />
            )}
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
            {isRakutenSearch ? (
              <Search className="h-3.5 w-3.5" />
            ) : (
              <BookOpen className="h-3.5 w-3.5" />
            )}
            <span>楽天Books</span>
          </a>
        </Button>
      )}
    </motion.div>
  );
}
