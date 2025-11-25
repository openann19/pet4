/**
 * Playdate Card
 *
 * Display card for playdates
 */

'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { MapPin, Users, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import type { Playdate } from '@petspark/core';

export interface PlaydateCardProps {
  playdate: Playdate;
  onJoin?: () => void;
  onView?: () => void;
  onCheckIn?: () => void;
  isParticipant?: boolean;
  className?: string;
}

export function PlaydateCard({
  playdate,
  onJoin,
  onView,
  onCheckIn,
  isParticipant = false,
  className,
}: PlaydateCardProps): React.JSX.Element {
  const scheduledDate = new Date(playdate.scheduledAt);
  const isUpcoming = scheduledDate > new Date();
  const _isPast = scheduledDate < new Date();

  return (
    <PremiumCard variant="glass" className={cn('p-4 space-y-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn(getTypographyClasses('h3'), 'mb-1')}>{playdate.title}</h3>
          {playdate.description && (
            <p className={cn(getTypographyClasses('bodyMuted'), 'text-sm line-clamp-2')}>
              {playdate.description}
            </p>
          )}
        </div>
        <Badge
          variant={
            playdate.status === 'confirmed'
              ? 'default'
              : playdate.status === 'cancelled'
                ? 'destructive'
                : 'secondary'
          }
        >
          {playdate.status}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="size-4" />
          <span>{format(scheduledDate, 'PPP p')}</span>
          {isUpcoming && (
            <span className="text-xs">
              ({formatDistanceToNow(scheduledDate, { addSuffix: true })})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          <span className="truncate">
            {playdate.location.address ?? `${playdate.location.latitude.toFixed(4)}, ${playdate.location.longitude.toFixed(4)}`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>
            {playdate.participants.length}
            {playdate.maxParticipants && ` / ${playdate.maxParticipants}`} participants
          </span>
        </div>

        {playdate.isPublic && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="size-4" />
            <span>Public meetup</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {onView && (
          <Button type="button" variant="outline" onClick={onView} className="flex-1">
            View Details
          </Button>
        )}
        {onJoin && !isParticipant && isUpcoming && playdate.status === 'confirmed' && (
          <Button type="button" onClick={onJoin} className="flex-1">
            Join
          </Button>
        )}
        {onCheckIn && isParticipant && isUpcoming && (
          <Button type="button" variant="secondary" onClick={onCheckIn} className="flex-1">
            Check In
          </Button>
        )}
      </div>
    </PremiumCard>
  );
}
