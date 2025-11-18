/**
 * Incoming Call Toast
 *
 * Toast notification for incoming calls with accept/decline actions
 */

'use client';

import { Phone, PhoneOff } from 'lucide-react';
import { MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export interface IncomingCallToastProps {
  open: boolean;
  callerName: string;
  callerAvatar?: string | null;
  onAccept: () => void;
  onDecline: () => void;
  className?: string;
}

export function IncomingCallToast({
  open,
  callerName,
  callerAvatar,
  onAccept,
  onDecline,
  className,
}: IncomingCallToastProps): React.JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <div className={cn('fixed inset-x-0 top-4 z-50 flex justify-center pointer-events-none', className)}>
      <MotionView
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="pointer-events-auto"
      >
        <PremiumCard
          variant="glass"
          className={cn(
            'flex items-center gap-4 px-6 py-4',
            'backdrop-blur-xl border-white/10',
            'min-w-[320px] max-w-md',
            'shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
          )}
        >
          <Avatar className="size-12 border-2 border-emerald-500/50">
            <AvatarImage src={callerAvatar ?? undefined} alt={callerName} />
            <AvatarFallback className="bg-emerald-500/20 text-emerald-100">
              {callerName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div
              className={cn(
                getTypographyClasses('caption'),
                'text-xs font-medium uppercase tracking-wide text-emerald-400 mb-1'
              )}
            >
              Incoming call
            </div>
            <div
              className={cn(
                getTypographyClasses('h3'),
                'text-sm font-semibold text-white truncate'
              )}
            >
              {callerName}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              isIconOnly
              variant="ghost"
              onClick={() => void onDecline()}
              aria-label="Decline call"
              className="rounded-full size-10 bg-red-500/20 text-red-100 hover:bg-red-500/30"
            >
              <PhoneOff className="size-5" aria-hidden="true" />
            </Button>

            <Button
              type="button"
              size="sm"
              isIconOnly
              variant="primary"
              onClick={() => void onAccept()}
              aria-label="Accept call"
              className="rounded-full size-10 bg-emerald-500 text-white hover:bg-emerald-600"
            >
              <Phone className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </PremiumCard>
      </MotionView>
    </div>
  );
}

