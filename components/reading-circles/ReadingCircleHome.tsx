import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// 型定義（テストのダミーデータに合わせる）
type Circle = {
  id: string;
  title: string;
  members: number;
  progress: number;
  status: string;
  nextEvent: string;
};

type Props = {
  circles: Circle[];
};

const ReadingCircleHome: React.FC<Props> = ({ circles }) => {
  // 次回開催予定（最も近い日付）
  const nextCircle = [...circles].sort((a, b) => a.nextEvent.localeCompare(b.nextEvent))[0];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* 次回開催予定カード */}
      <Card>
        <CardHeader>
          <CardTitle>次回開催予定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="font-bold text-lg">{nextCircle.title}</div>
            <div>開催日: {nextCircle.nextEvent}</div>
            <div>参加メンバー: {nextCircle.members}人</div>
            <Badge>{nextCircle.status}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* マイ読書会カード一覧 */}
      <div className="space-y-4">
        {circles.map(circle => (
          <Card key={circle.id}>
            <CardHeader>
              <CardTitle>{circle.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div>参加メンバー: {circle.members}人</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge>{circle.status}</Badge>
                    <div className="w-32">
                      <Progress value={circle.progress} data-testid="circle-progress-bar" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 新規作成ボタン */}
      <div className="flex justify-end">
        <Button>新規作成</Button>
      </div>
    </div>
  );
};

export default ReadingCircleHome;
