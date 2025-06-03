'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface EditReadingCirclePageProps {
  params: { id: string };
}

export default function EditReadingCirclePage({ params }: EditReadingCirclePageProps) {
  const router = useRouter();

  useEffect(() => {
    // 編集機能はモーダル表示に移行したため、詳細ページにリダイレクト
    router.replace(`/reading-circles/${params.id}`);
  }, [router, params.id]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-muted-foreground">リダイレクト中...</p>
      </div>
    </div>
  );
}
