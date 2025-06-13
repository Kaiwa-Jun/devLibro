'use client';

import AuthButton from '@/components/auth/AuthButton';
import { useAuth } from '@/components/auth/AuthProvider';
import { ReadingCircleHome } from '@/components/reading-circles/ReadingCircleHome';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReadingCirclesPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">輪読会</h1>
            <p className="text-muted-foreground max-w-3xl">
              技術書の輪読会を開催・参加して、仲間と一緒に学習を進めましょう。
              知識の共有と議論を通じて、より深い理解を得ることができます。
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              輪読会機能を利用するには、ログインが必要です。
            </p>
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">輪読会</h1>
          <p className="text-muted-foreground max-w-3xl">
            技術書の輪読会を開催・参加して、仲間と一緒に学習を進めましょう。
            知識の共有と議論を通じて、より深い理解を得ることができます。
          </p>
        </div>

        <ReadingCircleHome userId={user.id} />
      </div>
    </div>
  );
}
