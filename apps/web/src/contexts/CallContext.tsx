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
import { useWebRtcCall } from '@/hooks/calls/useWebRtcCall';
import { useAuth } from '@/contexts/AuthContext';
import { IncomingCallBanner } from '@/components/calls/IncomingCallBanner';
import { CallOverlay } from '@/components/calls/CallOverlay';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CallContext');

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
  handleIncomingOffer: (signal: CallOfferSignal) => Promise<void>,
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
      void handleIncomingOffer(signal);
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
    session?.direction === 'incoming' ? session.remoteParticipant.displayName : 'Incoming call';
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
      session={session}
      localStream={localStream}
      remoteStream={remoteStream}
      status={status}
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
    signaling: { url: signalingUrl, token: signalingToken, userId: user?.id ?? '' },
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
