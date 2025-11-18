/**
 * Call Control Bar
 *
 * Control bar for video calls with mute, camera, screen share, and hang up controls
 */

'use client';

import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { getTypographyClasses } from '@/lib/typography';

export interface CallControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  className?: string;
}

export function CallControlBar({
  isMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
  className,
}: CallControlBarProps): React.JSX.Element {
  return (
    <PremiumCard
      variant="glass"
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-3',
        'backdrop-blur-xl border-white/10',
        className
      )}
    >
      <Button
        type="button"
        size="sm"
        isIconOnly
        variant="ghost"
        onClick={() => void onToggleMute()}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        className={cn(
          'rounded-full size-12',
          isMuted
            ? 'bg-red-500/20 text-red-100 hover:bg-red-500/30'
            : 'bg-white/10 text-white hover:bg-white/20'
        )}
      >
        {isMuted ? (
          <MicOff className="size-5" aria-hidden="true" />
        ) : (
          <Mic className="size-5" aria-hidden="true" />
        )}
      </Button>

      <Button
        type="button"
        size="sm"
        isIconOnly
        variant="ghost"
        onClick={() => void onToggleCamera()}
        aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        className={cn(
          'rounded-full size-12',
          isCameraOff
            ? 'bg-red-500/20 text-red-100 hover:bg-red-500/30'
            : 'bg-white/10 text-white hover:bg-white/20'
        )}
      >
        {isCameraOff ? (
          <VideoOff className="size-5" aria-hidden="true" />
        ) : (
          <Video className="size-5" aria-hidden="true" />
        )}
      </Button>

      <Button
        type="button"
        size="sm"
        isIconOnly
        variant="ghost"
        onClick={() => void onToggleScreenShare()}
        aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        className={cn(
          'rounded-full size-12',
          isScreenSharing
            ? 'bg-blue-500/20 text-blue-100 hover:bg-blue-500/30'
            : 'bg-white/10 text-white hover:bg-white/20'
        )}
      >
        {isScreenSharing ? (
          <MonitorOff className="size-5" aria-hidden="true" />
        ) : (
          <Monitor className="size-5" aria-hidden="true" />
        )}
      </Button>

      <div className="h-8 w-px bg-white/20" />

      <Button
        type="button"
        size="sm"
        isIconOnly
        variant="destructive"
        onClick={() => void onEndCall()}
        aria-label="End call"
        className="rounded-full size-12 bg-red-500 hover:bg-red-600 text-white"
      >
        <PhoneOff className="size-5" aria-hidden="true" />
      </Button>
    </PremiumCard>
  );
}

