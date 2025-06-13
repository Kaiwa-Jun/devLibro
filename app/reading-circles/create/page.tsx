'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { CreateCircleForm } from '@/components/reading-circles/CreateCircleForm';
import { Button } from '@/components/ui/button';

export default function CreateReadingCirclePage() {
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // クライアントサイドでのみリダイレクトを行う
  if (isClient && !loading && !user) {
    // パラメータを追加して、読書会作成のためのログインであることを伝える
    redirect('/login?redirectFrom=reading-circle-create');
  }

  // ローディング中はシンプルなローディング表示
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 pb-16 md:pb-0">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/reading-circles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">新しい読書会を作成</h1>
        </div>

        <CreateCircleForm />
      </div>
    </div>
  );
}
