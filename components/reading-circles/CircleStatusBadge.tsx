'use client';

import { Badge } from '@/components/ui/badge';
import { ReadingCircle, getCircleStatus, statusLabels } from '@/types';

interface CircleStatusBadgeProps {
  circle: ReadingCircle;
  className?: string;
}

export function CircleStatusBadge({ circle, className = '' }: CircleStatusBadgeProps) {
  const currentStatus = getCircleStatus(circle);
  const statusInfo = statusLabels[currentStatus as keyof typeof statusLabels] || statusLabels.draft;

  return (
    <Badge variant={statusInfo.variant} className={`${statusInfo.color} ${className}`}>
      {statusInfo.label}
    </Badge>
  );
}
