'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { pageview } from '@/lib/analytics/gtag';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // URLが変更されたときにページビューを送信
    if (pathname) {
      pageview(pathname);
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}
