'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);

    // Google Analyticsを無効にする場合の処理
    // この例では、cookieを削除し、データ収集を無効にする
    if (typeof window !== 'undefined') {
      // GAを無効化するcookieを設定
      document.cookie = `ga-disable-${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}=true; expires=Thu, 31 Dec 2099 23:59:59 UTC; path=/`;

      // 既存のGAクッキーを削除
      document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = '_ga_*=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = '_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = '_gat=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              このサイトではCookieを使用してユーザー体験を向上させています。
              <Link
                href="/privacy-policy"
                className="text-blue-600 hover:text-blue-800 underline ml-1"
              >
                プライバシーポリシー
              </Link>
              をご確認ください。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={declineCookies}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              拒否
            </button>
            <button
              onClick={acceptCookies}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              同意する
            </button>
            <button
              onClick={declineCookies}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="閉じる"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
