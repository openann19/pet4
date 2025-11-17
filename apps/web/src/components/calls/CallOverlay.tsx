// apps/web/src/components/calls/CallOverlay.tsx
'use client';

import { PhoneOff, Mic, MicOff, Video, VideoOff, MonitorUp } from 'lucide-react';
import { MotionView } from '@petspark/motion';
import type { CallSession, CallStatus } from '@/lib/call-types';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import { Button } from '@/components/ui/button';
import { CallParticipantsGrid } from './CallParticipantsGrid';

export interface CallOverlayProps {
  open: boolean;
  session: CallSession | null;
  status: CallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  onClose: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
}

function TopBar({
  statusLabel,
  remoteName,
  onClose,
}: {
  statusLabel: string;
  remoteName: string;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between px-6 pt-4 pb-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            getTypographyClasses('caption'),
            'text-xs font-medium uppercase tracking-wide text-emerald-400'
          )}
        >
          {statusLabel}
        </span>
        <span className={cn(getTypographyClasses('h2'), 'truncate text-base text-slate-50')}>
          {remoteName}
        </span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full border-slate-600/70 bg-slate-900/60 text-slate-200 hover:bg-slate-800"
        onClick={onClose}
      >
        Minimize
      </Button>
    </div>
  );
}

const MuteBtn = ({ isMuted, onToggleMute }: { isMuted: boolean; onToggleMute: () => void }) => (
  <Button
    type="button"
    size="sm"
    isIconOnly
    variant="outline"
    onClick={onToggleMute}
    aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
    className={cn(
      'rounded-full border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800',
      isMuted && 'bg-red-700/70 text-red-50 hover:bg-red-700'
    )}
  >
    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
  </Button>
);

const CameraBtn = ({
  isCameraOff,
  onToggleCamera,
}: {
  isCameraOff: boolean;
  onToggleCamera: () => void;
}) => (
  <Button
    type="button"
    size="sm"
    isIconOnly
    variant="outline"
    onClick={onToggleCamera}
    aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
    className={cn(
      'rounded-full border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800',
      isCameraOff && 'bg-slate-800 text-slate-300'
    )}
  >
    {isCameraOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
  </Button>
);

const ScreenShareBtn = ({
  isActive,
  isScreenSharing,
  onToggleScreenShare,
}: {
  isActive: boolean;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
}) => (
  <Button
    type="button"
    size="sm"
    isIconOnly
    variant="outline"
    onClick={onToggleScreenShare}
    aria-label={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
    disabled={!isActive}
    className={cn(
      'rounded-full border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800 disabled:opacity-40',
      isScreenSharing && 'bg-emerald-600 text-white hover:bg-emerald-500'
    )}
  >
    <MonitorUp className="h-4 w-4" />
  </Button>
);

const EndBtn = ({ onEndCall }: { onEndCall: () => void }) => (
  <Button
    type="button"
    size="sm"
    isIconOnly
    variant="destructive"
    onClick={onEndCall}
    aria-label="End call"
    className="rounded-full bg-red-600 text-white hover:bg-red-700"
  >
    <PhoneOff className="h-4 w-4" />
  </Button>
);

function ControlsBar({
  isActive,
  isMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
}: {
  isActive: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}): React.JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-6">
      <div className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-slate-700/70 bg-slate-900/80 px-5 py-3 shadow-[0_20px_80px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <MuteBtn isMuted={isMuted} onToggleMute={onToggleMute} />
        <CameraBtn isCameraOff={isCameraOff} onToggleCamera={onToggleCamera} />
        <ScreenShareBtn
          isActive={isActive}
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={onToggleScreenShare}
        />
        <EndBtn onEndCall={onEndCall} />
      </div>
    </div>
  );
}

function MainGrid({
  session,
  localStream,
  remoteStream,
}: {
  session: CallSession;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}): React.JSX.Element {
  return (
    <div className="relative flex flex-1 items-stretch justify-stretch px-4 pb-24 pt-2">
      <CallParticipantsGrid
        session={session}
        localStream={localStream}
        remoteStream={remoteStream}
      />
    </div>
  );
}

function getStatusLabel(status: CallStatus): string {
  if (status === 'ringing') return 'Ringing…';
  if (status === 'connecting') return 'Connecting…';
  if (status === 'active') return 'In call';
  if (status === 'failed') return 'Call failed';
  if (status === 'ended') return 'Call ended';
  return 'Call';
}

export function CallOverlay({
  open,
  session,
  status,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  isScreenSharing,
  onClose,
  onEndCall,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
}: CallOverlayProps): React.JSX.Element | null {
  if (!open || !session) return null;
  const remote = session.remoteParticipant;
  const isActive = status === 'connecting' || status === 'ringing' || status === 'active';
  const statusLabel = getStatusLabel(status);
  return (
    <div className="fixed inset-0 z-80 flex items-stretch justify-stretch bg-black/80 backdrop-blur-xl">
      <MotionView
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 210, damping: 24 }}
        className={cn(
          'relative m-2 flex w-full flex-col overflow-hidden rounded-3xl border border-slate-700/60',
          'bg-[radial-gradient(circle_at_top,rgba(2,6,23,0.98),rgba(2,6,23,0.9),rgba(2,6,23,1))]',
          'shadow-[0_40px_120px_rgba(0,0,0,0.9)]'
        )}
      >
        <TopBar statusLabel={statusLabel} remoteName={remote.name} onClose={onClose} />

        <MainGrid session={session} localStream={localStream} remoteStream={remoteStream} />

        <ControlsBar
          isActive={isActive}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare}
          onEndCall={onEndCall}
        />
      </MotionView>
    </div>
  );
}
