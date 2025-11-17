// apps/web/src/components/calls/IncomingCallBanner.tsx
'use client';

import { memo } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';

export interface IncomingCallBannerProps {
  readonly open: boolean;
  readonly callerName: string;
  readonly onAccept: () => void;
  readonly onReject: () => void;
}

const DeclineButton = memo<{ readonly onClick: () => void }>(({ onClick }) => (
  <Button
    type="button"
    size="sm"
    isIconOnly
    variant="outline"
    onClick={onClick}
    aria-label="Decline call"
    className="rounded-full border-red-500/60 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-red-50"
  >
    <PhoneOff className="h-4 w-4" />
  </Button>
));
DeclineButton.displayName = 'DeclineButton';

const AcceptButton = memo<{ readonly onClick: () => void }>(({ onClick }) => (
  <Button
    type="button"
    size="sm"
    isIconOnly
    variant="secondary"
    onClick={onClick}
    aria-label="Accept call"
    className="rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
  >
    <Phone className="h-4 w-4" />
  </Button>
));
AcceptButton.displayName = 'AcceptButton';

export const IncomingCallBanner = memo<IncomingCallBannerProps>(
  ({ open, callerName, onAccept, onReject }) => {
    if (!open) {
      return null;
    }

    return (
      <div className="pointer-events-none fixed inset-x-0 top-0 z-90 flex justify-center">
        <MotionView
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 16, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          className={cn(
            'pointer-events-auto mx-3 flex max-w-md flex-1 items-center justify-between gap-4 rounded-2xl',
            'border border-white/10 bg-[rgba(15,23,42,0.96)] px-4 py-3',
            'backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
          )}
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <span
              className={cn(
                getTypographyClasses('caption'),
                'text-xs font-medium uppercase tracking-wide text-emerald-400'
              )}
            >
              Incoming call
            </span>
            <span className={cn(getTypographyClasses('h3'), 'truncate text-sm text-white')}>
              {callerName}
            </span>
            <span className="text-xs text-muted-foreground">Tap to answer or decline</span>
          </div>

          <div className="flex items-center gap-2">
            <DeclineButton onClick={onReject} />
            <AcceptButton onClick={onAccept} />
          </div>
        </MotionView>
      </div>
    );
  }
);
IncomingCallBanner.displayName = 'IncomingCallBanner';
