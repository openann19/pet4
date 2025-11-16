/**
 * Call View
 *
 * Main call interface view for video calls
 */

'use client';

import { useEffect, useRef } from 'react';
import { CallGrid } from '@/components/calls/CallGrid';
import { CallControlBar } from '@/components/calls/CallControlBar';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import type { CallSession } from '@/lib/calls/call-types';

export interface CallViewProps {
  session: CallSession;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  className?: string;
}

function formatCallDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function CallView({
  session,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
  className,
}: CallViewProps): React.JSX.Element {
  const durationRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (session.status === 'in-call') {
      intervalRef.current = window.setInterval(() => {
        durationRef.current += 1;
      }, 1000);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session.status]);

  const participants = session.kind === 'group' && session.participants
    ? session.participants.map((p) => ({
        participant: p,
        stream: null as MediaStream | null,
      }))
    : session.remoteParticipant
      ? [
          {
            participant: session.remoteParticipant,
            stream: remoteStream,
          },
        ]
      : [];

  return (
    <PageTransitionWrapper>
      <div
        className={cn(
          'fixed inset-0 z-40',
          'bg-[radial-gradient(circle_at_top,#0f172a,#020617)]',
          'flex flex-col',
          className
        )}
      >
        {/* Header */}
        <PremiumCard
          variant="glass"
          className={cn(
            'absolute top-4 left-4 right-4 z-10',
            'flex items-center justify-between px-4 py-3',
            'backdrop-blur-xl border-white/10'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                getTypographyClasses('h3'),
                'text-sm font-semibold text-white'
              )}
            >
              {session.kind === 'group'
                ? 'Group Call'
                : session.remoteParticipant?.displayName ?? 'Call'}
            </div>
            {session.status === 'in-call' && (
              <div
                className={cn(
                  getTypographyClasses('caption'),
                  'text-xs text-muted-foreground'
                )}
              >
                {formatCallDuration(durationRef.current)}
              </div>
            )}
          </div>

          <div
            className={cn(
              getTypographyClasses('caption'),
              'text-xs font-medium',
              session.status === 'connecting'
                ? 'text-yellow-400'
                : session.status === 'in-call'
                  ? 'text-emerald-400'
                  : 'text-muted-foreground'
            )}
          >
            {session.status === 'connecting' && 'Connecting...'}
            {session.status === 'in-call' && 'Connected'}
            {session.status === 'ringing' && 'Ringing...'}
          </div>
        </PremiumCard>

        {/* Video Grid */}
        <div className="flex-1 overflow-hidden pt-20 pb-32">
          <CallGrid
            participants={participants}
            localParticipant={session.localParticipant}
            localStream={localStream}
          />
        </div>

        {/* Control Bar */}
        <CallControlBar
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare}
          onEndCall={onEndCall}
        />
      </div>
    </PageTransitionWrapper>
  );
}

