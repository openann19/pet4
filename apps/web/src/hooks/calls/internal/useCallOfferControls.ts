// apps/web/src/hooks/calls/internal/useCallOfferControls.ts
'use client';

import { useCallback } from 'react';
import type { CallOfferSignal, CallSession } from '@petspark/core';
import type { CallSignalingClient } from '@petspark/core';

export interface OfferControlsArgs {
  readonly localUserId: string;
  readonly ensurePeerConnection: () => RTCPeerConnection;
  readonly createLocalMedia: (constraints?: MediaStreamConstraints) => Promise<MediaStream>;
  readonly buildSessionParticipants: (
    direction: 'incoming' | 'outgoing',
    remoteUserId: string,
    remoteDisplayName: string,
    remoteAvatarUrl?: string | null
  ) => CallSession;
  readonly setSession: (updater: (prev: CallSession | null) => CallSession | null) => void;
  readonly setStatus: (
    status: 'idle' | 'ringing' | 'connecting' | 'in-call' | 'failed' | 'ended'
  ) => void;
  readonly signalingClient: CallSignalingClient;
  readonly currentCallIdRef: React.MutableRefObject<string | null>;
  readonly remoteUserIdRef: React.MutableRefObject<string | null>;
  readonly pendingRemoteOfferRef: React.MutableRefObject<CallOfferSignal | null>;
  readonly resetSession: (reason?: string) => void;
}

export function useCallOfferControls(args: OfferControlsArgs) {
  const {
    localUserId,
    ensurePeerConnection,
    createLocalMedia,
    buildSessionParticipants,
    setSession,
    setStatus,
    signalingClient,
    currentCallIdRef,
    remoteUserIdRef,
    pendingRemoteOfferRef,
    resetSession,
  } = args;

  const startOutgoingCall = useCallback(
    async ({
      callId,
      remoteUserId,
      remoteDisplayName,
      remoteAvatarUrl,
    }: {
      callId: string;
      remoteUserId: string;
      remoteDisplayName: string;
      remoteAvatarUrl?: string | null;
    }) => {
      try {
        currentCallIdRef.current = callId;
        remoteUserIdRef.current = remoteUserId;
        const pc = ensurePeerConnection();
        const stream = await createLocalMedia();
        void stream;
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        const sessionState = buildSessionParticipants(
          'outgoing',
          remoteUserId,
          remoteDisplayName,
          remoteAvatarUrl
        );
        setSession(() => sessionState);
        setStatus('ringing');
        signalingClient.send({
          type: 'call-offer',
          callId,
          fromUserId: localUserId,
          toUserId: remoteUserId,
          sdp: offer.sdp ?? '',
        });
      } catch (err) {
        resetSession((err as Error).message);
      }
    },
    [
      buildSessionParticipants,
      createLocalMedia,
      ensurePeerConnection,
      localUserId,
      resetSession,
      setSession,
      setStatus,
      signalingClient,
    ]
  );

  const handleIncomingOffer = useCallback(
    (signal: CallOfferSignal) => {
      try {
        currentCallIdRef.current = signal.callId;
        remoteUserIdRef.current = signal.fromUserId;
        pendingRemoteOfferRef.current = signal;
        const incomingSession = buildSessionParticipants(
          'incoming',
          signal.fromUserId,
          'Incoming caller'
        );
        incomingSession.startedAt = incomingSession.startedAt ?? new Date().toISOString();
        setSession(() => incomingSession);
        setStatus('ringing');
      } catch (err) {
        resetSession((err as Error).message);
      }
      return Promise.resolve();
    },
    [buildSessionParticipants, resetSession, setSession, setStatus]
  );

  return { startOutgoingCall, handleIncomingOffer } as const;
}
