'use client';

import { useEffect, useState } from 'react';
import { getCircleParticipants, updateParticipantStatus } from '@/lib/supabase/reading-circles';
import { CircleParticipant } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface CircleParticipantsProps {
  circleId: string;
  isHost?: boolean;
}

export default function CircleParticipants({ circleId, isHost = false }: CircleParticipantsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [participants, setParticipants] = useState<CircleParticipant[]>([]);
  const [pendingRequests, setPendingRequests] = useState<CircleParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      setIsLoading(true);
      
      const approvedParticipants = await getCircleParticipants(circleId, 'approved');
      setParticipants(approvedParticipants);
      
      if (isHost) {
        const requests = await getCircleParticipants(circleId, 'pending');
        setPendingRequests(requests);
      }
      
      setIsLoading(false);
    };
    
    fetchParticipants();
  }, [circleId, isHost]);

  const handleApprove = async (participantId: string) => {
    const result = await updateParticipantStatus(participantId, 'approved');
    if (result) {
      const approvedParticipant = pendingRequests.find(p => p.id === participantId);
      if (approvedParticipant) {
        setPendingRequests(prev => prev.filter(p => p.id !== participantId));
        setParticipants(prev => [...prev, { ...approvedParticipant, status: 'approved' }]);
      }
      
      toast({
        title: '参加リクエストを承認しました',
      });
    } else {
      toast({
        title: 'エラー',
        description: '参加リクエストの承認に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleDecline = async (participantId: string) => {
    const result = await updateParticipantStatus(participantId, 'declined');
    if (result) {
      setPendingRequests(prev => prev.filter(p => p.id !== participantId));
      
      toast({
        title: '参加リクエストを拒否しました',
      });
    } else {
      toast({
        title: 'エラー',
        description: '参加リクエストの拒否に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'host':
        return <Badge className="bg-primary">ホスト</Badge>;
      case 'co-host':
        return <Badge variant="secondary">共同ホスト</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isHost && pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>参加リクエスト</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map(participant => (
                <div key={participant.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={participant.user?.avatar_url} />
                      <AvatarFallback>{participant.user?.display_name?.substring(0, 2) || 'ユ'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{participant.user?.display_name || '名前なし'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleApprove(participant.id)}>
                      <Check className="h-4 w-4 mr-1" />
                      承認
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDecline(participant.id)}>
                      <X className="h-4 w-4 mr-1" />
                      拒否
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>参加者一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">参加者はまだいません</p>
          ) : (
            <div className="space-y-4">
              {participants.map(participant => (
                <div key={participant.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={participant.user?.avatar_url} />
                      <AvatarFallback>{participant.user?.display_name?.substring(0, 2) || 'ユ'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{participant.user?.display_name || '名前なし'}</p>
                        {getRoleBadge(participant.role)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {participant.joined_at && `参加: ${new Date(participant.joined_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
