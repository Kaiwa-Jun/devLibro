'use client';

import { toast } from 'sonner';

import { EditCircleForm } from '@/components/reading-circles/EditCircleForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReadingCircle } from '@/types';

interface EditCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  circle: ReadingCircle & {
    books?: {
      id: string;
      title: string;
      author: string;
      img_url: string;
      isbn?: string;
      language?: string;
      categories?: string[];
      description?: string;
      avg_difficulty?: number;
      programmingLanguages?: string[];
      frameworks?: string[];
    };
  };
  onSuccess?: (circleId: string) => void;
}

export function EditCircleModal({ isOpen, onClose, circle, onSuccess }: EditCircleModalProps) {
  const handleSuccess = async (circleId: string) => {
    toast.success('輪読会を更新しました');
    onClose();
    if (onSuccess) {
      await onSuccess(circleId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>輪読会を編集</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <EditCircleForm
            circle={circle}
            onSuccess={handleSuccess}
            onCancel={onClose}
            isModal={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
