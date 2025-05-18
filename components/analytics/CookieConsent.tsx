'use client';

import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState<boolean>(false);

  useEffect(() => {
    // ローカルストレージからクッキー同意の状態を確認
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // 少し遅延させて表示すると、ページ読み込み直後のアニメーションが自然になる
      const timer = setTimeout(() => {
        setShowConsent(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowConsent(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowConsent(false);

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

  return (
    <AnimatePresence>
      {showConsent && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 bg-blue-50 dark:bg-slate-800 border-t-2 border-blue-200 dark:border-slate-700 p-4 shadow-lg"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1">
              <p className="text-sm">
                当サイトではアクセス解析のためCookieを使用しています。 詳しくは
                <Link href="/privacy-policy" className="text-primary hover:underline font-medium">
                  プライバシーポリシー
                </Link>
                をご確認ください。
              </p>
            </div>
            <div className="flex flex-row gap-2">
              <Button variant="outline" size="sm" onClick={handleDecline}>
                拒否
              </Button>
              <Button size="sm" onClick={handleAccept} className="bg-blue-600 hover:bg-blue-700">
                同意する
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowConsent(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
