// apps/web/src/hooks/calls/internal/usePeerConnection.ts
'use client';

import { useCallback, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { CallCandidateSignal, CallStatus, CallSignalingClient } from '@petspark/core';

export interface UsePeerConnectionArgs {
  readonly iceConfig: RTCConfiguration;
  readonly localUserId: string;
  readonly setStatus: (updater: (prev: CallStatus) => CallStatus) => void;
  readonly setRemoteStream: Dispatch<SetStateAction<MediaStream | null>>;
  readonly signalingClient: CallSignalingClient;
  readonly currentCallIdRef: React.MutableRefObject<string | null>;
  readonly remoteUserIdRef: React.MutableRefObject<string | null>;
}

function createEnsurePeerConnection(
  args: UsePeerConnectionArgs,
  peerRef: React.MutableRefObject<RTCPeerConnection | null>
) {
  const {
    iceConfig,
    localUserId,
    setStatus,
    setRemoteStream,
    signalingClient,
    currentCallIdRef,
    remoteUserIdRef,
  } = args;
  return () => {
    if (peerRef.current && peerRef.current.connectionState !== 'closed') {
      return peerRef.current;
    }

    const pc = new RTCPeerConnection(iceConfig);

    pc.onicecandidate = (event) => {
      if (!event.candidate || !currentCallIdRef.current || !remoteUserIdRef.current) {
        return;
      }
      const candidateSignal: CallCandidateSignal = {
        type: 'call-candidate',
        callId: currentCallIdRef.current,
        fromUserId: localUserId,
        toUserId: remoteUserIdRef.current,
        candidate: event.candidate,
      };
      try {
        signalingClient.send(candidateSignal);
      } catch {
        // ignore
      }
    };

    pc.ontrack = (event: RTCTrackEvent) => {
      const [stream] = event.streams;
      if (!stream) return;
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connecting': {
          setStatus((prev) => (prev === 'ended' ? prev : 'connecting'));
          break;
        }
        case 'connected': {
          setStatus((prev) => (prev === 'ended' ? prev : 'in-call'));
          break;
        }
        case 'disconnected':
        case 'failed': {
          setStatus((prev) => (prev === 'ended' ? prev : 'failed'));
          break;
        }
        case 'closed': {
          setStatus((prev) => (prev === 'ended' ? prev : 'ended'));
          break;
        }
        default:
          break;
      }
    };

    peerRef.current = pc;
    return pc;
  };
}

function createCleanupPeer(
  peerRef: React.MutableRefObject<RTCPeerConnection | null>,
  setRemoteStream: Dispatch<SetStateAction<MediaStream | null>>
) {
  return () => {
    if (peerRef.current) {
      peerRef.current.getSenders().forEach((sender) => {
        try {
          peerRef.current?.removeTrack(sender);
        } catch {
          // ignore
        }
      });
      peerRef.current.onicecandidate = null;
      peerRef.current.ontrack = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
      peerRef.current = null;
    }
    setRemoteStream((prev: MediaStream | null) => {
      if (prev) prev.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      return null;
    });
  };
}

export function usePeerConnection(args: UsePeerConnectionArgs) {
  const {
    iceConfig,
    localUserId,
    setStatus,
    setRemoteStream,
    signalingClient,
    currentCallIdRef,
    remoteUserIdRef,
  } = args;
  const peerRef = useRef<RTCPeerConnection | null>(null);

  const ensurePeerConnection = useCallback(
    createEnsurePeerConnection(
      {
        iceConfig,
        localUserId,
        setStatus,
        setRemoteStream,
        signalingClient,
        currentCallIdRef,
        remoteUserIdRef,
      },
      peerRef
    ),
    [
      iceConfig,
      localUserId,
      setStatus,
      setRemoteStream,
      signalingClient,
      currentCallIdRef,
      remoteUserIdRef,
    ]
  );

  const cleanupPeer = useCallback(createCleanupPeer(peerRef, setRemoteStream), [setRemoteStream]);

  return { peerRef, ensurePeerConnection, cleanupPeer } as const;
}
