// apps/web/src/hooks/calls/internal/useCallAnswerControls.ts
'use client';

import { useCallback } from 'react';
import type { CallAnswerSignal, CallOfferSignal, CallSession } from '@petspark/core';
import type { CallSignalingClient } from '@petspark/core';

export interface AnswerControlsArgs {
  readonly localUserId: string;
  readonly ensurePeerConnection: () => RTCPeerConnection;
  readonly createLocalMedia: (constraints?: MediaStreamConstraints) => Promise<MediaStream>;
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
export function useAcceptIncomingCall(args: AnswerControlsArgs) {
  const {
    localUserId,
    ensurePeerConnection,
    createLocalMedia,
    setSession,
    setStatus,
    signalingClient,
    currentCallIdRef,
    remoteUserIdRef,
    pendingRemoteOfferRef,
    resetSession,
  } = args;
  return useCallback(async () => {
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
}

export function useEndRejectControls(args: AnswerControlsArgs) {
  const { localUserId, signalingClient, currentCallIdRef, remoteUserIdRef, resetSession } = args;
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

  return { rejectIncomingCall, endCall } as const;
}
