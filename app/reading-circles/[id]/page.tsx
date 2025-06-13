'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReadingCircleDetailPage() {
  const params = useParams();
  const id = params.id;

  return (
    <div className="min-h-screen bg-background pt-16 pb-16 md:pb-0">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/reading-circles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">輪読会詳細</h1>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>輪読会詳細（ID: {id}）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>輪読会詳細機能は実装予定です。</p>
              <p className="mt-2">今回はUIコンポーネントの実装のみを行いました。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
