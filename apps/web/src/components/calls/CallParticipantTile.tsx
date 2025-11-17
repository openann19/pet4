// apps/web/src/components/calls/CallParticipantTile.tsx
'use client';

import { memo, useEffect, useRef } from 'react';
import { MicOff, VideoOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';

export interface CallParticipantTileProps {
  stream: MediaStream | null;
  displayName: string;
  avatarUrl?: string | null;
  isLocal: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  emphasis?: 'primary' | 'secondary';
  className?: string;
}

const MutedBadge = memo(() => (
  <div className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-slate-200">
    <MicOff className="h-3 w-3" />
    <span>Muted</span>
  </div>
));
MutedBadge.displayName = 'MutedBadge';

function AvatarBlock({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}): React.JSX.Element {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-20 w-20 rounded-full border border-white/20 object-cover shadow-lg"
      />
    );
  }
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-2xl font-semibold text-slate-100 shadow-lg">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function PlaceholderContent({
  displayName,
  avatarUrl,
  isLocal,
  isMuted,
}: Pick<
  CallParticipantTileProps,
  'displayName' | 'avatarUrl' | 'isLocal' | 'isMuted'
>): React.JSX.Element {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      <AvatarBlock name={displayName} avatarUrl={avatarUrl} />
      <div className="flex flex-col items-center gap-1">
        <span className={cn(getTypographyClasses('h3'), 'text-sm font-semibold text-slate-50')}>
          {displayName}
          {isLocal && <span className="ml-1 text-xs font-normal text-slate-300">(You)</span>}
        </span>
        {isMuted && <MutedBadge />}
      </div>
    </div>
  );
}

function VideoSurface({
  stream,
  isLocal,
}: Pick<CallParticipantTileProps, 'stream' | 'isLocal'>): React.JSX.Element | null {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) {
      return;
    }
    if (stream) {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  if (!stream) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      className={cn('h-full w-full object-cover', isLocal && 'scale-x-[-1]')}
    />
  );
}

export function CallParticipantTile({
  stream,
  displayName,
  avatarUrl,
  isLocal,
  isMuted,
  isCameraOff,
  emphasis = 'primary',
  className,
}: CallParticipantTileProps): React.JSX.Element {
  const showVideo = Boolean(stream) && !isCameraOff;

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10',
        'bg-[radial-gradient(circle_at_top,#0f172a,#020617)]',
        emphasis === 'primary'
          ? 'shadow-[0_40px_120px_rgba(0,0,0,0.7)]'
          : 'shadow-[0_20px_60px_rgba(0,0,0,0.6)]',
        className
      )}
    >
      {showVideo ? (
        <VideoSurface stream={stream} isLocal={isLocal} />
      ) : (
        <PlaceholderContent
          displayName={displayName}
          avatarUrl={avatarUrl}
          isLocal={isLocal}
          isMuted={isMuted}
        />
      )}

      {!showVideo && isCameraOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <VideoOff className="h-6 w-6 text-white/80" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.28),transparent_55%)]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-4 pb-3">
        <div className="flex flex-col">
          <span
            className={cn(
              getTypographyClasses('body'),
              'text-sm font-medium text-slate-50 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]'
            )}
          >
            {displayName}
            {isLocal && <span className="ml-1 text-xs opacity-80">(You)</span>}
          </span>
        </div>

        {isMuted && <MutedBadge />}
      </div>
    </div>
  );
}
