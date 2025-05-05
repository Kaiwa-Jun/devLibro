'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate, getDifficultyInfo } from '@/lib/utils';
import { Review } from '@/types';

type ReviewItemProps = {
  review: Review & { experienceLabel?: string };
};

export default function ReviewItem({ review }: ReviewItemProps) {
  const difficultyInfo = getDifficultyInfo(review.difficulty);
  const DifficultyIcon = difficultyInfo.icon;

  return (
    <motion.div
      className="p-4 border rounded-lg bg-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarFallback className="bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{review.user_name}</p>
            <Badge variant="outline" className="border">
              経験 {review.experienceLabel || `${review.experience_years}年`}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1.5 border"
              style={{ color: `var(--${difficultyInfo.color})` }}
            >
              <DifficultyIcon style={{ color: `var(--${difficultyInfo.color})` }} />
              <span>{difficultyInfo.label}</span>
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDate(review.created_at)}
            </span>
          </div>

          <p className="mt-2 text-sm">{review.comment}</p>
        </div>
      </div>
    </motion.div>
  );
}
