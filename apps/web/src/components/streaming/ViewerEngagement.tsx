/**
 * Viewer Engagement
 *
 * Hearts/emotes overlay for stream viewers
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { MotionView } from '@petspark/motion';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import { haptics } from '@/lib/haptics';

export interface ViewerEngagementProps {
  viewerCount: number;
  onHeart?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  className?: string;
}

export function ViewerEngagement({
  viewerCount,
  onHeart,
  onComment,
  onShare,
  className,
}: ViewerEngagementProps): React.JSX.Element {
  const [hearts, setHearts] = useState<{ id: string; x: number; y: number }[]>([]);

  const handleHeart = useCallback(() => {
    haptics.impact('light');
    const newHeart = {
      id: `heart-${Date.now()}-${Math.random()}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
    };
    setHearts((prev) => [...prev, newHeart]);
    onHeart?.();

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 2000);
  }, [onHeart]);

  return (
    <div className={cn('relative', className)}>
      <PremiumCard variant="glass" className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={cn(getTypographyClasses('body'), 'font-medium')}>
              {viewerCount}
            </span>
            <span className={cn(getTypographyClasses('caption'), 'text-muted-foreground')}>
              viewers
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleHeart}
              className="rounded-full"
              aria-label="Send heart"
            >
              <Heart className="size-5 text-red-500" />
            </Button>

            {onComment && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onComment}
                className="rounded-full"
                aria-label="Comment"
              >
                <MessageCircle className="size-5" />
              </Button>
            )}

            {onShare && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onShare}
                className="rounded-full"
                aria-label="Share"
              >
                <Share2 className="size-5" />
              </Button>
            )}
          </div>
        </div>
      </PremiumCard>

      {/* Floating hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {hearts.map((heart) => (
          <MotionView
            key={heart.id}
            initial={{ opacity: 0, y: 0, scale: 0 }}
            animate={{ opacity: 1, y: -100, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute"
            style={{
              left: `${heart.x}%`,
              top: `${heart.y}%`,
            }}
          >
            <Heart className="size-6 text-red-500 fill-red-500" />
          </MotionView>
        ))}
      </div>
    </div>
  );
}

