'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useAnalytics } from '@/hooks/useAnalytics';
import { debugMode } from '@/lib/analytics/gtag';

interface BookDetailTrackingProps {
  bookId: string;
  bookTitle: string;
}

/**
 * 書籍詳細表示時にGoogle Analyticsにイベントを送信するクライアントコンポーネント
 */
export default function BookDetailTracking({ bookId, bookTitle }: BookDetailTrackingProps) {
  const { trackBookView } = useAnalytics();
  const pathname = usePathname();

  useEffect(() => {
    // 書籍の閲覧をトラッキング
    trackBookView(bookId, bookTitle);

    // デバッグモード（開発環境）の場合はコンソールに表示
    if (debugMode()) {
      console.log(`[Analytics Debug] Book view tracked: ${bookId} - ${bookTitle}`);
    }
  }, [bookId, bookTitle, pathname, trackBookView]);

  // このコンポーネントは画面に何も表示しない
  return null;
}
