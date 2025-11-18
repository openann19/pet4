/**
 * Stream Analytics Panel
 *
 * Creator analytics for live streams
 */

'use client';

import { formatDuration } from 'date-fns';
import { Users, Heart, MessageCircle, Eye } from 'lucide-react';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';

export interface StreamAnalyticsPanelProps {
  viewerCount: number;
  streamDuration: number;
  heartCount?: number;
  commentCount?: number;
  onClose?: () => void;
  className?: string;
}

export function StreamAnalyticsPanel({
  viewerCount,
  streamDuration,
  heartCount = 0,
  commentCount = 0,
  onClose,
  className,
}: StreamAnalyticsPanelProps): React.JSX.Element {
  const formattedDuration = formatDuration(
    { seconds: streamDuration },
    { format: ['hours', 'minutes'] }
  );

  return (
    <PremiumCard variant="glass" className={cn('p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className={cn(getTypographyClasses('h3'))}>Stream Analytics</h3>
        {onClose && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => void onClose()}
            className="size-6"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4" />
            <span className={cn(getTypographyClasses('caption'), 'text-xs')}>Viewers</span>
          </div>
          <p className={cn(getTypographyClasses('h2'), 'text-2xl font-bold')}>{viewerCount}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="size-4" />
            <span className={cn(getTypographyClasses('caption'), 'text-xs')}>Duration</span>
          </div>
          <p className={cn(getTypographyClasses('body'), 'text-lg font-semibold')}>
            {formattedDuration}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="size-4" />
            <span className={cn(getTypographyClasses('caption'), 'text-xs')}>Hearts</span>
          </div>
          <p className={cn(getTypographyClasses('body'), 'text-lg font-semibold')}>{heartCount}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="size-4" />
            <span className={cn(getTypographyClasses('caption'), 'text-xs')}>Comments</span>
          </div>
          <p className={cn(getTypographyClasses('body'), 'text-lg font-semibold')}>
            {commentCount}
          </p>
        </div>
      </div>
    </PremiumCard>
  );
}

