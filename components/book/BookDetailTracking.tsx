'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface BookDetailTrackingProps {
  bookId: string;
  bookTitle: string;
}

/**
 * 書籍詳細表示時にGoogle Analyticsにイベントを送信するクライアントコンポーネント
 */
export default function BookDetailTracking({ bookId, bookTitle }: BookDetailTrackingProps) {
  const { trackBookView, isDebugMode } = useAnalytics();
  const pathname = usePathname();

  useEffect(() => {
    // 書籍の閲覧をトラッキング
    trackBookView(bookId, bookTitle);

    // デバッグモード（開発環境）の場合はコンソールに表示
    if (isDebugMode) {
      console.log(`[Analytics Debug] Book view tracked: ${bookId} - ${bookTitle}`);
    }
  }, [bookId, bookTitle, pathname, trackBookView, isDebugMode]);

  // このコンポーネントは画面に何も表示しない
  return null;
}
