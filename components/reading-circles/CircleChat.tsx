'use client';

import { useEffect, useState, useRef } from 'react';
import { getCircleMessages, postCircleMessage } from '@/lib/supabase/reading-circles';
import { CircleMessage } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Pin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface CircleChatProps {
  circleId: string;
}

export default function CircleChat({ circleId }: CircleChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<CircleMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<CircleMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      const messagesData = await getCircleMessages(circleId);
      
      const pinned = messagesData.filter(m => m.is_pinned);
      const regular = messagesData.filter(m => !m.is_pinned);
      
      setPinnedMessages(pinned);
      setMessages(regular);
      setIsLoading(false);
      
      scrollToBottom();
    };
    
    fetchMessages();
    
    const interval = setInterval(fetchMessages, 30000); // 30秒ごとに更新（デモ用）
    
    return () => clearInterval(interval);
  }, [circleId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!user) {
      toast({
        title: 'エラー',
        description: 'ログインが必要です',
        variant: 'destructive',
      });
      return;
    }
    
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    
    try {
      const messageData = {
        circle_id: circleId,
        user_id: user.id,
        message: newMessage.trim(),
        is_pinned: false,
      };
      
      const result = await postCircleMessage(messageData);
      
      if (result) {
        setMessages(prev => [...prev, result]);
        setNewMessage('');
        
        setTimeout(scrollToBottom, 100);
      } else {
        toast({
          title: 'エラー',
          description: 'メッセージの送信に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      toast({
        title: 'エラー',
        description: 'メッセージの送信中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ja,
    });
  };

  const renderMessage = (message: CircleMessage) => {
    const isCurrentUser = user && message.user_id === user.id;
    
    return (
      <div 
        key={message.id} 
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {!isCurrentUser && (
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={message.user?.avatar_url} />
            <AvatarFallback>{message.user?.display_name?.substring(0, 2) || 'ユ'}</AvatarFallback>
          </Avatar>
        )}
        
        <div 
          className={`max-w-[70%] rounded-lg p-3 ${
            isCurrentUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}
        >
          {!isCurrentUser && (
            <p className="text-xs font-medium mb-1">{message.user?.display_name || '名前なし'}</p>
          )}
          <p className="whitespace-pre-line break-words">{message.message}</p>
          <p className="text-xs mt-1 opacity-70 text-right">
            {formatMessageTime(message.created_at)}
          </p>
        </div>
        
        {isCurrentUser && (
          <Avatar className="h-8 w-8 ml-2">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>{user.display_name?.substring(0, 2) || 'ユ'}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>チャット</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-16 w-60" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pinnedMessages.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center">
              <Pin className="h-4 w-4 mr-1" />
              ピン留めされたメッセージ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pinnedMessages.map(message => (
                <div key={message.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={message.user?.avatar_url} />
                      <AvatarFallback>{message.user?.display_name?.substring(0, 2) || 'ユ'}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium">{message.user?.display_name || '名前なし'}</p>
                  </div>
                  <p className="text-sm">{message.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="flex flex-col h-[500px]">
        <CardHeader className="py-3 border-b">
          <CardTitle>チャット</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">まだメッセージはありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t">
          {user ? (
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="メッセージを入力..."
                className="resize-none min-h-[60px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                className="self-end"
                onClick={handleSendMessage}
                disabled={isSending || !newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              メッセージを送信するにはログインしてください
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
