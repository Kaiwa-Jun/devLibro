'use client';

import { motion } from 'framer-motion';
import { BookOpen, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { generateAmazonURL, generateRakutenURL } from '@/lib/api/commerce';

type PurchaseLinksProps = {
  isbn: string;
};

/**
 * 書籍の購入リンク（AmazonおよびRakutenBooks）を表示するコンポーネント
 */
export default function PurchaseLinks({ isbn }: PurchaseLinksProps) {
  // ISBNからURLを生成
  const amazonUrl = generateAmazonURL(isbn);
  const rakutenUrl = generateRakutenURL(isbn);

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
