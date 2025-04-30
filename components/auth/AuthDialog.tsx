'use client';

import { motion } from 'framer-motion';
import { BookOpen, Chrome, Github, Lock, Mail, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  signInWithEmail,
  signInWithGitHub,
  signInWithGoogle,
  signUpWithEmail,
} from '@/lib/supabase/client';

type AuthDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthDialog({ isOpen, onClose }: AuthDialogProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('メールアドレスとパスワードを入力してください');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data?.session) {
        toast.success('ログインしました');
        onClose();
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('ログイン処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast.error('すべての項目を入力してください');
      return;
    }

    try {
      setLoading(true);
      const { error } = await signUpWithEmail(email, password, name);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('アカウントを作成しました。確認メールを送信しました。');
      onClose();
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('アカウント作成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    try {
      setLoading(true);

      if (provider === 'github') {
        const { error } = await signInWithGitHub();
        if (error) {
          toast.error(error.message);
          return;
        }
      } else if (provider === 'google') {
        const { error } = await signInWithGoogle();
        if (error) {
          toast.error(error.message);
          return;
        }
      }

      // OAuthリダイレクトが行われるので、ここにはたどり着かない
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast.error(`${provider}ログイン中にエラーが発生しました`);
      setLoading(false);
    }
  };

  const SocialLoginButtons = () => (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleSocialLogin('github')}
        disabled={loading}
      >
        <Github className="mr-2 h-4 w-4" />
        GitHubでログイン
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleSocialLogin('google')}
        disabled={loading}
      >
        <Chrome className="mr-2 h-4 w-4" />
        Googleでログイン
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="w-full space-y-6">
          <div className="text-center">
            <motion.div
              className="flex justify-center"
              whileHover={{ rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <BookOpen className="h-12 w-12 text-primary" />
            </motion.div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight">DevLibroにログイン</h2>
            <p className="mt-1 text-sm text-muted-foreground">技術書の管理をもっと便利に</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">ログイン</TabsTrigger>
              <TabsTrigger value="signup">新規登録</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="mt-6 space-y-6">
                <SocialLoginButtons />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">または</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">メールアドレス</Label>
                    <div className="mt-1 relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="example@email.com"
                        className="pl-10"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="login-password">パスワード</Label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'ログイン中...' : 'ログイン'}
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="signup">
              <div className="mt-6 space-y-6">
                <SocialLoginButtons />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">または</span>
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">ユーザー名</Label>
                    <div className="mt-1 relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="ユーザー名"
                        className="pl-10"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-email">メールアドレス</Label>
                    <div className="mt-1 relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="example@email.com"
                        className="pl-10"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signup-password">パスワード</Label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? '処理中...' : 'アカウントを作成'}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
