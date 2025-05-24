'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate, getDifficultyInfo } from '@/lib/utils';
import { truncateUserName } from '@/lib/utils/truncate';
import { Review } from '@/types';

type ReviewItemProps = {
  review: Review & {
    experienceLabel?: string;
    anonymous?: boolean;
  };
};

export default function ReviewItem({ review }: ReviewItemProps) {
  const difficultyInfo = getDifficultyInfo(review.difficulty, 'review');
  const DifficultyIcon = difficultyInfo.icon;

  // 匿名ユーザーかどうかの判定
  const isAnonymous = review.anonymous === true;

  return (
    <motion.div
      className="p-4 border rounded-lg bg-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarFallback className={isAnonymous ? 'bg-gray-200' : 'bg-primary/10'}>
            <User className={`h-4 w-4 ${isAnonymous ? 'text-gray-500' : 'text-primary'}`} />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium" title={isAnonymous ? '匿名' : review.user_name}>
              {isAnonymous ? '匿名' : truncateUserName(review.user_name)}
            </p>
            <Badge variant="outline" className="border">
              経験 {review.experienceLabel || `${review.experience_years}年`}
            </Badge>
            <div
              className={`text-xs py-0.5 px-2 rounded-full whitespace-nowrap w-fit min-w-[4rem] flex-shrink-0 font-medium flex items-center justify-center border ${
                difficultyInfo.color === 'difficulty-easy'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : difficultyInfo.color === 'difficulty-somewhat-easy'
                    ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                    : difficultyInfo.color === 'difficulty-normal'
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : difficultyInfo.color === 'difficulty-somewhat-hard'
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : difficultyInfo.color === 'difficulty-hard'
                          ? 'bg-purple-50 text-purple-600 border-purple-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              <DifficultyIcon className="h-3 w-3 flex-shrink-0 mr-0.5" />
              <span>{difficultyInfo.label}</span>
            </div>
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
