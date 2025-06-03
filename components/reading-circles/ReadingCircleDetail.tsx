'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  BookOpen,
  Calendar,
  Clock,
  Edit,
  Globe,
  Lock,
  MessageCircle,
  Settings,
  Star,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { EditCircleModal } from '@/components/modals/EditCircleModal';
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
import { CircleParticipant, ReadingCircle, getCircleStatus, statusLabels } from '@/types';

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

export function ReadingCircleDetail({ circle, userId }: ReadingCircleDetailProps) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCircle, setCurrentCircle] = useState(circle);

  const isOrganizer = currentCircle.created_by === userId;

  // リアルタイムステータス判定を使用
  const currentStatus = getCircleStatus(currentCircle);
  const statusInfo = statusLabels[currentStatus as keyof typeof statusLabels] || statusLabels.draft;

  const userParticipation = currentCircle.circle_participants?.find(p => p.user_id === userId);
  const isParticipant = !!userParticipation;
  const canJoin =
    !isParticipant &&
    !isOrganizer &&
    currentStatus === 'recruiting' &&
    currentCircle.participant_count < currentCircle.max_participants;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`/api/reading-circles/${currentCircle.id}`, {
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
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`/api/reading-circles/${currentCircle.id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '参加申請に失敗しました' }));
        throw new Error(errorData.error || '参加申請に失敗しました');
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
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`/api/reading-circles/${currentCircle.id}`, {
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

  const handleEditSuccess = async (circleId: string) => {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error('認証トークンが見つかりません');
        router.refresh();
        return;
      }

      const response = await fetch(`/api/reading-circles/${circleId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentCircle(result.data);
        console.log('✅ [編集成功] 最新データで状態更新完了');
      } else {
        console.error('最新データの取得に失敗しました');
        router.refresh();
      }
    } catch (error) {
      console.error('最新データ取得エラー:', error);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative bg-white border-b border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row gap-6 lg:gap-8">
            {/* Book Cover */}
            {currentCircle.books && (
              <div className="flex-shrink-0 self-start">
                <div className="relative group">
                  <img
                    src={currentCircle.books.img_url}
                    alt={currentCircle.books.title}
                    className="w-24 h-32 sm:w-32 sm:h-44 lg:w-40 lg:h-56 object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
                </div>
              </div>
            )}

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-3 mb-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  {currentCircle.is_private ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>プライベート</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>公開</span>
                    </>
                  )}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {currentCircle.title}
              </h1>

              {currentCircle.books && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-800 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    {currentCircle.books.title}
                  </div>
                  <p className="text-gray-600 mb-2">著者: {currentCircle.books.author}</p>
                  {currentCircle.books.page_count && (
                    <p className="text-sm text-gray-500">{currentCircle.books.page_count}ページ</p>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 sm:gap-6 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-sm sm:text-base">
                    {currentCircle.participant_count}/{currentCircle.max_participants}名
                  </span>
                </div>
                {currentCircle.start_date && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-sm sm:text-base">
                      開始予定: {format(new Date(currentCircle.start_date), 'M/d', { locale: ja })}
                      {currentCircle.end_date &&
                        ` 〜 ${format(new Date(currentCircle.end_date), 'M/d', { locale: ja })}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm sm:text-base">
                    {format(new Date(currentCircle.created_at), 'yyyy/M/d に作成', { locale: ja })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {canJoin && (
                  <Button
                    onClick={handleJoin}
                    disabled={isJoining}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    {isJoining ? '申請中...' : '参加申請'}
                  </Button>
                )}

                {isOrganizer && (
                  <>
                    <Button variant="outline" onClick={() => setIsEditModalOpen(true)} size="lg">
                      <Edit className="w-5 h-5 mr-2" />
                      編集
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="lg">
                          <Trash2 className="w-5 h-5 mr-2" />
                          削除
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
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {currentCircle.description && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  概要
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {currentCircle.description}
                  </p>
                </div>
              </div>
            )}

            {/* Book Details */}
            {currentCircle.books?.description && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  書籍について
                </h2>
                <p className="text-gray-700 leading-relaxed line-clamp-6">
                  {currentCircle.books.description}
                </p>
              </div>
            )}

            {/* Organizer Actions */}
            {isOrganizer && currentStatus === 'draft' && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  主催者メニュー
                </h2>
                <p className="text-gray-600 mb-4">
                  開始予定日が設定されている場合、自動的にステータスが変更されます。手動でステータスを変更することも可能です。
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleStatusChange('recruiting')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    募集開始
                  </Button>
                  <Button onClick={() => handleStatusChange('active')} variant="outline">
                    開催開始
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">主催者</h3>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                    {currentCircle.users?.display_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">
                    {currentCircle.users?.display_name || '不明'}
                  </p>
                  <p className="text-sm text-gray-500">主催者</p>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">参加者</h3>
                <span className="text-sm text-gray-500">
                  {currentCircle.participant_count}/{currentCircle.max_participants}
                </span>
              </div>

              <div className="space-y-3">
                {currentCircle.circle_participants?.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">まだ参加者がいません</p>
                  </div>
                ) : (
                  currentCircle.circle_participants?.map(participant => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gray-100 text-gray-700">
                          {participant.users?.display_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {participant.users?.display_name || '不明'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
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
            </div>

            {/* Progress Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                進捗
              </h3>
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">進捗機能は準備中です</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 編集モーダル */}
      <EditCircleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        circle={currentCircle}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
