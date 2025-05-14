'use client';

import { BookJsonLd as BookJsonLdType, generateBookJsonLd } from '@/lib/seo/metadata';

import JsonLd from './JsonLd';

interface BookJsonLdProps {
  book: BookJsonLdType;
}

/**
 * 書籍の構造化データを埋め込むコンポーネント
 */
export default function BookJsonLd({ book }: BookJsonLdProps) {
  const jsonLdData = generateBookJsonLd(book);
  return <JsonLd data={jsonLdData} />;
}
