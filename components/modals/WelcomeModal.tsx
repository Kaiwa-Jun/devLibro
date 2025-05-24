'use client';

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUserProfile } from '@/lib/supabase/client';

const experienceOptions = [
  { value: '0', label: '未経験' },
  { value: '1', label: '1年未満' },
  { value: '2', label: '1〜3年' },
  { value: '3', label: '3〜5年' },
  { value: '4', label: '5年以上' },
];

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const { user } = useAuth();
  const [experience, setExperience] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

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
      const years = yearsMap[experience];

      // Supabaseに保存
      const { error } = await updateUserProfile(user.id, {
        experience_years: years,
      });

      if (error) {
        toast.error('プロフィールの更新に失敗しました');
        return;
      }

      toast.success('経験年数を設定しました');
      onClose();
    } catch (error) {
      toast.error('プロフィールの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <div className="text-center mb-6">
          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              duration: 0.8,
            }}
            whileHover={{ rotate: 10 }}
          >
            <div className="bg-primary/10 p-4 rounded-full">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </motion.div>
        </div>

        <DialogHeader>
          <DialogTitle className="text-center">DevLibroへようこそ！</DialogTitle>
          <DialogDescription className="text-center">
            あなたの経験年数を設定すると、より適切な書籍の推薦やレビューの表示ができるようになります。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Label htmlFor="experience">経験年数</Label>
            <Select value={experience} onValueChange={setExperience}>
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
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存して続ける'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
