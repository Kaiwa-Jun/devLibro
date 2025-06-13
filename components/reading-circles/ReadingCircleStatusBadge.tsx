'use client';

import { Users, Calendar, CheckCircle, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ReadingCircleStatus = 'recruiting' | 'in-progress' | 'completed' | 'upcoming';

interface ReadingCircleStatusBadgeProps {
  status: ReadingCircleStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  recruiting: {
    label: '募集中',
    icon: Users,
    variant: 'default' as const,
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  'in-progress': {
    label: '進行中',
    icon: Clock,
    variant: 'default' as const,
    className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  },
  completed: {
    label: '完了済み',
    icon: CheckCircle,
    variant: 'secondary' as const,
    className: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
  },
  upcoming: {
    label: '開催予定',
    icon: Calendar,
    variant: 'default' as const,
    className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
};

export default function ReadingCircleStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: ReadingCircleStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'font-medium border transition-colors',
        config.className,
        sizeClasses[size],
        showIcon && 'flex items-center gap-1',
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}
