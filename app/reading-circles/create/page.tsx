'use client';

import AuthButton from '@/components/auth/AuthButton';
import { useAuth } from '@/components/auth/AuthProvider';
import { CreateCircleForm } from '@/components/reading-circles/CreateCircleForm';
import { Skeleton } from '@/components/ui/skeleton';

export default function CreateReadingCirclePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">輪読会を作成</h1>
            <p className="text-muted-foreground">
              技術書の輪読会を作成して、仲間と一緒に学習を進めましょう。
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">輪読会を作成するには、ログインが必要です。</p>
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">輪読会を作成</h1>
          <p className="text-muted-foreground">
            技術書の輪読会を作成して、仲間と一緒に学習を進めましょう。
          </p>
        </div>

        <CreateCircleForm />
      </div>
    </div>
  );
}
