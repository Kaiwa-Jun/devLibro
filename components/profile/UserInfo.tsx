'use client';

import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, updateUserProfile } from '@/lib/supabase/client';
import { truncateUserName } from '@/lib/utils/truncate';

const experienceOptions = [
  { value: '0', label: '未経験' },
  { value: '1', label: '1年未満' },
  { value: '2', label: '1〜3年' },
  { value: '3', label: '3〜5年' },
  { value: '4', label: '5年以上' },
];

const getExperienceLabel = (value: string) => {
  return experienceOptions.find(option => option.value === value)?.label || '未設定';
};

const getExperienceValue = (years: number) => {
  if (years === 0) return '0';
  if (years < 1) return '1';
  if (years < 3) return '2';
  if (years < 5) return '3';
  return '4';
};

export default function UserInfo() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ユーザー情報を状態として保持
  const [userName, setUserName] = useState<string>('ユーザー');
  const [experienceYears, setExperienceYears] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedExperience, setEditedExperience] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

  // ユーザー情報とプロフィール情報の取得
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        // ユーザー名の初期設定
        const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー';
        setUserName(displayName);
        setEditedName(displayName);

        // Supabaseからプロフィール情報を取得
        try {
          const { data, error } = await getUserProfile(user.id);
          if (error) {
            console.error('プロフィール取得エラー:', error);
            return;
          }

          if (data) {
            // プロフィール情報があれば反映
            if (data.display_name) {
              setUserName(String(data.display_name));
              setEditedName(String(data.display_name));
            }

            if (data.experience_years !== undefined && data.experience_years !== null) {
              const years = Number(data.experience_years);
              setExperienceYears(years);
              setEditedExperience(getExperienceValue(years));
            }
          }
        } catch (error) {
          console.error('プロフィール取得中にエラーが発生しました:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      // 経験年数の値を数値に変換
      const yearsMap: Record<string, number> = {
        '0': 0,
        '1': 0.5,
        '2': 2,
        '3': 4,
        '4': 5,
      };
      const years = yearsMap[editedExperience];

      // Supabaseに保存
      const { error } = await updateUserProfile(user.id, {
        display_name: editedName,
        experience_years: years,
      });

      if (error) {
        console.error('プロフィール更新エラー:', error);
        toast({
          variant: 'destructive',
          title: 'エラー',
          description: 'プロフィールの更新に失敗しました。',
        });
        return;
      }

      // 成功したら表示を更新
      setUserName(editedName);
      setExperienceYears(years);
      setEditMode(false);

      toast({
        title: '更新完了',
        description: 'プロフィール情報を更新しました。',
      });
    } catch (error) {
      console.error('保存中にエラーが発生しました:', error);
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'プロフィールの更新に失敗しました。',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // アバターに表示する頭文字を取得
  const getInitials = () => {
    if (!userName) return 'U';
    return userName.charAt(0).toUpperCase();
  };

  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Avatar className="h-16 w-16">
        <AvatarFallback className="bg-primary/10">{getInitials()}</AvatarFallback>
      </Avatar>

      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold" title={userName}>
            {truncateUserName(userName)}
          </h2>
          <Dialog open={editMode} onOpenChange={setEditMode}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <LucideIcons.Edit2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>プロフィール編集</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">ユーザー名</Label>
                  <Input
                    id="username"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">経験年数</Label>
                  <Select value={editedExperience} onValueChange={setEditedExperience}>
                    <SelectTrigger id="experience" className="w-full">
                      <SelectValue placeholder="経験年数を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">キャンセル</Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Badge variant="outline" className="mt-1 border">
          経験 {getExperienceLabel(getExperienceValue(experienceYears))}
        </Badge>
      </div>
    </motion.div>
  );
}
