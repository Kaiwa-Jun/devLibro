'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar, Edit, Globe, Lock, Settings, Trash2, UserPlus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleParticipant, ReadingCircle } from '@/types';

interface ReadingCircleDetailProps {
  circle: ReadingCircle & {
    books?: {
      id: string;
      title: string;
      author: string;
      img_url: string;
      description?: string;
      page_count?: number;
    };
    users?: {
      id: string;
      display_name: string;
    };
    circle_participants?: (CircleParticipant & {
      users?: {
        id: string;
        display_name: string;
      };
    })[];
  };
  userId?: string;
}

const statusLabels = {
  draft: { label: '下書き', variant: 'secondary' as const },
  recruiting: { label: '募集中', variant: 'default' as const },
  active: { label: '開催中', variant: 'default' as const },
  completed: { label: '終了', variant: 'outline' as const },
  cancelled: { label: 'キャンセル', variant: 'destructive' as const },
};

export function ReadingCircleDetail({ circle, userId }: ReadingCircleDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const isOrganizer = circle.created_by === userId;
  const statusInfo = statusLabels[circle.status] || statusLabels.draft;

  const userParticipation = circle.circle_participants?.find(p => p.user_id === userId);
  const isParticipant = !!userParticipation;
  const canJoin =
    !isParticipant &&
    !isOrganizer &&
    circle.status === 'recruiting' &&
    circle.participant_count < circle.max_participants;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Supabaseセッションからアクセストークンを取得
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`/api/reading-circles/${circle.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('輪読会の削除に失敗しました');
      }

      toast.success('輪読会を削除しました');
      router.push('/reading-circles');
    } catch (error) {
      console.error('Error deleting circle:', error);
      toast.error(error instanceof Error ? error.message : '削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleJoin = async () => {
    if (!canJoin) return;

    setIsJoining(true);
    try {
      // Supabaseセッションからアクセストークンを取得
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`/api/reading-circles/${circle.id}/participants`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('参加申請に失敗しました');
      }

      toast.success('参加申請を送信しました');
      router.refresh();
    } catch (error) {
      console.error('Error joining circle:', error);
      toast.error(error instanceof Error ? error.message : '参加申請に失敗しました');
    } finally {
      setIsJoining(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!isOrganizer) return;

    try {
      // Supabaseセッションからアクセストークンを取得
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`/api/reading-circles/${circle.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('ステータスの更新に失敗しました');
      }

      toast.success('ステータスを更新しました');
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error instanceof Error ? error.message : 'ステータスの更新に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{circle.title}</h1>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {circle.is_private ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              <span>{circle.is_private ? 'プライベート' : '公開'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>
                {circle.participant_count}/{circle.max_participants}名
              </span>
            </div>
            {circle.start_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(circle.start_date), 'yyyy/M/d', { locale: ja })}
                  {circle.end_date &&
                    ` 〜 ${format(new Date(circle.end_date), 'yyyy/M/d', { locale: ja })}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {canJoin && (
            <Button onClick={handleJoin} disabled={isJoining}>
              <UserPlus className="w-4 h-4 mr-2" />
              {isJoining ? '申請中...' : '参加申請'}
            </Button>
          )}

          {isOrganizer && (
            <>
              <Button variant="outline" asChild>
                <a href={`/reading-circles/${circle.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  編集
                </a>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>輪読会を削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      この操作は取り消せません。輪読会に関するすべてのデータが削除されます。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? '削除中...' : '削除'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {circle.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">概要</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">{circle.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Book Information */}
          {circle.books && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">対象書籍</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <img
                    src={circle.books.img_url}
                    alt={circle.books.title}
                    className="w-24 h-32 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{circle.books.title}</h3>
                    <p className="text-muted-foreground mb-3">{circle.books.author}</p>
                    {circle.books.page_count && (
                      <p className="text-sm text-muted-foreground mb-3">
                        ページ数: {circle.books.page_count}ページ
                      </p>
                    )}
                    {circle.books.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {circle.books.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organizer Actions */}
          {isOrganizer && circle.status === 'draft' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  主催者メニュー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={() => handleStatusChange('recruiting')} variant="default">
                    募集開始
                  </Button>
                  <Button onClick={() => handleStatusChange('active')} variant="outline">
                    開催開始
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organizer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">主催者</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{circle.users?.display_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{circle.users?.display_name || '不明'}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(circle.created_at), 'yyyy/M/d に作成', { locale: ja })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                参加者
                <span className="text-sm font-normal text-muted-foreground">
                  {circle.participant_count}/{circle.max_participants}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {circle.circle_participants?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">まだ参加者がいません</p>
                ) : (
                  circle.circle_participants?.map(participant => (
                    <div key={participant.id} className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {participant.users?.display_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participant.users?.display_name || '不明'}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={participant.role === 'organizer' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {participant.role === 'organizer' ? '主催者' : '参加者'}
                          </Badge>
                          <Badge
                            variant={participant.status === 'approved' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {participant.status === 'approved' ? '承認済み' : '申請中'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">スケジュール</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">スケジュール機能は準備中です</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
