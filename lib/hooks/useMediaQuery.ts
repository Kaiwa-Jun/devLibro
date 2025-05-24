'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // テスト環境やSSRでwindow.matchMediaが利用できない場合の対応
    if (typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia(query);
      setMatches(media.matches);

      const listener = () => setMatches(media.matches);

      // モダンなaddEventListenerを使用（古いブラウザ対応のためフォールバック付き）
      if (media.addEventListener) {
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
      } else {
        // 古いブラウザ対応
        media.addListener(listener);
        return () => media.removeListener(listener);
      }
    }
  }, [query]);

  // SSRでは常にfalseを返し、ハイドレーション後に実際の値を返す
  return mounted ? matches : false;
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}
