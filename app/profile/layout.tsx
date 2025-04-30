'use client';

import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // クライアントサイドでのみリダイレクトを行う
  if (isClient && !loading && !user) {
    // パラメータを追加して、本棚閲覧のためのログインであることを伝える
    redirect('/login?redirectFrom=bookshelf');
  }

  // ローディング中はシンプルなローディング表示
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
