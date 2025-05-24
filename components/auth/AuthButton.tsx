'use client';

import { LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import AuthDialog from '@/components/auth/AuthDialog';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { truncateUserName } from '@/lib/utils/truncate';

export default function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('ログアウトしました');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      toast.error('ログアウトに失敗しました');
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4 mr-2" />
        読み込み中...
      </Button>
    );
  }

  if (!user) {
    return (
      <>
        <Button variant="default" size="sm" onClick={() => setShowAuthDialog(true)}>
          <User className="h-4 w-4 mr-2" />
          ログイン
        </Button>
        <AuthDialog isOpen={showAuthDialog} onClose={() => setShowAuthDialog(false)} />
      </>
    );
  }

  const userName = user.user_metadata?.name || user.email || 'ユーザー';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4 mr-2" />
          {truncateUserName(userName)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href="/profile">プロフィール</a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
