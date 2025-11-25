// apps/web/src/contexts/CallContext.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CallOfferSignal, CallSession, CallStatus, CallSignal } from '@petspark/core';
import type { CallSession as LocalCallSession, CallStatus as LocalCallStatus, Call, CallParticipant } from '@/lib/call-types';
import { useWebRtcCall } from '@/hooks/calls/useWebRtcCall';
import { useAuth } from '@/contexts/AuthContext';
import { IncomingCallBanner } from '@/components/calls/IncomingCallBanner';
import { CallOverlay } from '@/components/calls/CallOverlay';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CallContext');

// Adapter functions to convert core types to local types
function adaptCallSession(coreSession: CallSession | null): LocalCallSession | null {
  if (!coreSession) return null;

  // Create a basic Call object from the core session
  const call: Call = {
    id: coreSession.id,
    roomId: coreSession.id, // Use session id as room id
    type: 'video', // Default to video, could be enhanced later
    initiatorId: coreSession.direction === 'outgoing' ? coreSession.localParticipant.id : (coreSession.remoteParticipant?.id ?? ''),
    recipientId: coreSession.direction === 'incoming' ? coreSession.localParticipant.id : (coreSession.remoteParticipant?.id ?? ''),
    status: adaptCallStatus(coreSession.status),
    startTime: coreSession.startedAt,
    endTime: coreSession.endedAt,
    duration: coreSession.endedAt ? new Date(coreSession.endedAt).getTime() - new Date(coreSession.startedAt).getTime() : 0,
    quality: 'good', // Default quality
    videoQuality: '720p', // Default video quality
  };

  // Adapt participants
  const localParticipant: CallParticipant = {
    id: coreSession.localParticipant.id,
    name: coreSession.localParticipant.displayName,
    avatar: coreSession.localParticipant.avatarUrl ?? undefined,
    isMuted: coreSession.localParticipant.microphone === 'muted',
    isVideoEnabled: coreSession.localParticipant.camera === 'enabled',
  };

  const remoteParticipant: CallParticipant = coreSession.remoteParticipant ? {
    id: coreSession.remoteParticipant.id,
    name: coreSession.remoteParticipant.displayName,
    avatar: coreSession.remoteParticipant.avatarUrl ?? undefined,
    isMuted: coreSession.remoteParticipant.microphone === 'muted',
    isVideoEnabled: coreSession.remoteParticipant.camera === 'enabled',
  } : {
    id: 'unknown',
    name: 'Unknown',
    isMuted: false,
    isVideoEnabled: false,
  };

  return {
    call,
    localParticipant,
    remoteParticipant,
    isMinimized: false, // Default to not minimized
    videoQuality: '720p', // Default video quality
  };
}

function adaptCallStatus(coreStatus: CallStatus): LocalCallStatus {
  switch (coreStatus) {
    case 'idle': return 'idle';
    case 'ringing': return 'ringing';
    case 'connecting': return 'connecting';
    case 'in-call': return 'active';
    case 'ended': return 'ended';
    case 'failed': return 'failed';
    default: return 'idle';
  }
}

export interface CallProviderProps {
  readonly signalingUrl: string;
  readonly signalingToken?: string;
  readonly children: ReactNode;
}

export interface CallContextValue {
  readonly session: CallSession | null;
  readonly status: CallStatus;
  readonly isMuted: boolean;
  readonly isCameraOff: boolean;
  readonly isScreenSharing: boolean;

  startCall: (params: {
    readonly remoteUserId: string;
    readonly remoteDisplayName: string;
    readonly remoteAvatarUrl?: string | null;
  }) => Promise<void>;

  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: (reason?: string) => void;
  endCall: (reason?: string) => void;

  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
}

const CallContext = createContext<CallContextValue | undefined>(undefined);

function useIncomingOfferListener(
  userId: string | undefined,
  signalingClient: { onSignal: (h: (s: CallSignal) => void) => () => void },
  handleIncomingOffer: (signal: CallOfferSignal) => void,
  setIncomingOffer: (s: CallOfferSignal | null) => void
): void {
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = signalingClient.onSignal((signal) => {
      if (signal.type !== 'call-offer' || signal.toUserId !== userId) return;
      logger.debug('Incoming call offer received', {
        fromUserId: signal.fromUserId,
        callId: signal.callId,
      });
      setIncomingOffer(signal);
      handleIncomingOffer(signal);
    });
    return () => unsubscribe();
  }, [handleIncomingOffer, signalingClient, setIncomingOffer, userId]);
}

function IncomingBannerWrapper({
  incomingOffer,
  session,
  status,
  onAccept,
  onReject,
}: {
  incomingOffer: CallOfferSignal | null;
  session: CallSession | null;
  status: CallStatus;
  onAccept: () => void;
  onReject: (reason?: string) => void;
}): React.JSX.Element {
  const callerName =
    session?.direction === 'incoming' ? (session.remoteParticipant?.displayName ?? 'Incoming call') : 'Incoming call';
  return (
    <IncomingCallBanner
      open={
        Boolean(incomingOffer) &&
        Boolean(session) &&
        session?.direction === 'incoming' &&
        status === 'ringing'
      }
      callerName={callerName}
      onAccept={onAccept}
      onReject={() => onReject('User rejected call')}
    />
  );
}

function OverlayWrapper({
  overlayOpen,
  session,
  status,
  localStream,
  remoteStream,
  isMuted,
  isCameraOff,
  isScreenSharing,
  onClose,
  onEnd,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
}: {
  overlayOpen: boolean;
  session: CallSession | null;
  status: CallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  onClose: () => void;
  onEnd: (reason?: string) => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
}): React.JSX.Element {
  return (
    <CallOverlay
      open={overlayOpen && !!session && status !== 'idle'}
      session={adaptCallSession(session)}
      localStream={localStream}
      remoteStream={remoteStream}
      status={adaptCallStatus(status)}
      isMuted={isMuted}
      isCameraOff={isCameraOff}
      isScreenSharing={isScreenSharing}
      onClose={onClose}
      onEndCall={() => onEnd('local-end')}
      onToggleMute={onToggleMute}
      onToggleCamera={onToggleCamera}
      onToggleScreenShare={onToggleScreenShare}
    />
  );
}

export function CallProvider({
  signalingUrl,
  signalingToken,
  children,
}: CallProviderProps): React.JSX.Element {
  const { user } = useAuth();
  const {
    session,
    status,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    signalingClient,
    startOutgoingCall,
    handleIncomingOffer,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  } = useWebRtcCall({
    signaling: { baseUrl: signalingUrl, token: signalingToken },
    localUserId: user?.id ?? '',
    localDisplayName: user?.displayName ?? user?.email ?? 'Unknown User',
    localAvatarUrl: user?.avatarUrl ?? null,
  });
  const [incomingOffer, setIncomingOffer] = useState<CallOfferSignal | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  useIncomingOfferListener(
    user?.id,
    { onSignal: (h) => signalingClient.onSignal(h) },
    handleIncomingOffer,
    setIncomingOffer
  );
  useEffect(() => {
    if (status === 'ended' || status === 'failed' || status === 'idle') {
      setOverlayOpen(false);
      setIncomingOffer(null);
    }
  }, [status]);
  const startCall = useCallback(
    async ({
      remoteUserId,
      remoteDisplayName,
      remoteAvatarUrl,
    }: {
      remoteUserId: string;
      remoteDisplayName: string;
      remoteAvatarUrl?: string | null;
    }) => {
      const callId = crypto.randomUUID();
      await startOutgoingCall({ callId, remoteUserId, remoteDisplayName, remoteAvatarUrl });
      setOverlayOpen(true);
    },
    [startOutgoingCall]
  );
  const handleAccept = useCallback(async () => {
    await acceptIncomingCall();
    setIncomingOffer(null);
    setOverlayOpen(true);
  }, [acceptIncomingCall]);
  const handleReject = useCallback(
    (reason?: string) => {
      rejectIncomingCall(reason);
      setIncomingOffer(null);
      setOverlayOpen(false);
    },
    [rejectIncomingCall]
  );
  const handleEnd = useCallback(
    (reason?: string) => {
      endCall(reason);
      setOverlayOpen(false);
      setIncomingOffer(null);
    },
    [endCall]
  );
  const value: CallContextValue = useMemo(
    () => ({
      session,
      status,
      isMuted,
      isCameraOff,
      isScreenSharing,
      startCall,
      acceptIncomingCall: handleAccept,
      rejectIncomingCall: handleReject,
      endCall: handleEnd,
      toggleMute,
      toggleCamera,
      toggleScreenShare,
    }),
    [
      session,
      status,
      isMuted,
      isCameraOff,
      isScreenSharing,
      startCall,
      handleAccept,
      handleReject,
      handleEnd,
      toggleMute,
      toggleCamera,
      toggleScreenShare,
    ]
  );
  return (
    <CallContext.Provider value={value}>
      {children}
      <IncomingBannerWrapper
        incomingOffer={incomingOffer}
        session={session}
        status={status}
        onAccept={() => {
          void handleAccept();
        }}
        onReject={handleReject}
      />
      <OverlayWrapper
        overlayOpen={overlayOpen}
        session={session}
        status={status}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        onClose={() => setOverlayOpen(false)}
        onEnd={handleEnd}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={() => {
          void toggleScreenShare();
        }}
      />
    </CallContext.Provider>
  );
}

export function useCall(): CallContextValue {
  const ctx = CallContext;
  const value = useContext(ctx);
  if (!value) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return value;
}
