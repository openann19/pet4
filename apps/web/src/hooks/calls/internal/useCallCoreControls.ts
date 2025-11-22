// apps/web/src/hooks/calls/internal/useCallCoreControls.ts
'use client';

import { useCallback } from 'react';
import type { CallAnswerSignal, CallOfferSignal, CallSession } from '@petspark/core';
import type { CallSignalingClient } from '@petspark/core';

export interface CoreControlsArgs {
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

export function useCallCoreControls(args: CoreControlsArgs) {
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
        void stream; // silence unused in some builds

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

        const offerSignal: CallOfferSignal = {
          type: 'call-offer',
          callId,
          fromUserId: localUserId,
          toUserId: remoteUserId,
          sdp: offer.sdp ?? '',
        };
        signalingClient.send(offerSignal);
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

  const acceptIncomingCall = useCallback(async () => {
    const offer = pendingRemoteOfferRef.current;
    const callId = currentCallIdRef.current;
    const remoteUserId = remoteUserIdRef.current;
    if (!offer || !callId || !remoteUserId) return;
    try {
      const pc = ensurePeerConnection();
      const stream = await createLocalMedia();
      void stream;

      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offer.sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setStatus('connecting');
      setSession((prev) =>
        prev
          ? { ...prev, status: 'connecting', startedAt: prev.startedAt ?? new Date().toISOString() }
          : prev
      );

      const answerSignal: CallAnswerSignal = {
        type: 'call-answer',
        callId,
        fromUserId: localUserId,
        toUserId: remoteUserId,
        sdp: answer.sdp ?? '',
      };
      signalingClient.send(answerSignal);
      pendingRemoteOfferRef.current = null;
    } catch (err) {
      resetSession((err as Error).message);
    }
  }, [
    createLocalMedia,
    ensurePeerConnection,
    localUserId,
    pendingRemoteOfferRef,
    resetSession,
    setSession,
    setStatus,
    signalingClient,
    currentCallIdRef,
    remoteUserIdRef,
  ]);

  const rejectIncomingCall = useCallback(
    (reason?: string) => {
      const callId = currentCallIdRef.current;
      const remoteUserId = remoteUserIdRef.current;
      if (!callId || !remoteUserId) return;
      try {
        signalingClient.send({
          type: 'call-reject',
          callId,
          fromUserId: localUserId,
          toUserId: remoteUserId,
          reason,
        });
      } catch {
        // ignore
      } finally {
        resetSession(reason ?? 'Call rejected');
      }
    },
    [currentCallIdRef, localUserId, remoteUserIdRef, resetSession, signalingClient]
  );

  const endCall = useCallback(
    (reason?: string) => {
      const callId = currentCallIdRef.current;
      const remoteUserId = remoteUserIdRef.current;
      if (callId && remoteUserId) {
        try {
          signalingClient.send({
            type: 'call-end',
            callId,
            fromUserId: localUserId,
            toUserId: remoteUserId,
            reason,
          });
        } catch {
          // ignore
        }
      }
      resetSession(reason);
    },
    [currentCallIdRef, localUserId, remoteUserIdRef, resetSession, signalingClient]
  );

  return {
    startOutgoingCall,
    handleIncomingOffer,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
  } as const;
}
