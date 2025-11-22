// apps/web/src/hooks/calls/useWebRtcCall.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CallAnswerSignal,
  CallCandidateSignal,
  CallDirection,
  CallOfferSignal,
  CallSession,
  CallSignal,
  CallStatus,
  SignalingConfig,
} from '@petspark/core';
import { CallSignalingClient } from '@petspark/core';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useWebRtcCall');

export interface UseWebRtcCallOptions {
  signaling: SignalingConfig;
  localUserId: string;
  localDisplayName: string;
  localAvatarUrl?: string | null;
  iceServers?: RTCIceServer[];
}

export interface WebRtcCallState {
  session: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  status: CallStatus;
}

export interface WebRtcCallControls {
  startOutgoingCall: (params: {
    callId: string;
    remoteUserId: string;
    remoteDisplayName: string;
    remoteAvatarUrl?: string | null;
  }) => Promise<void>;
  handleIncomingOffer: (signal: CallOfferSignal) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: (reason?: string) => void;
  endCall: (reason?: string) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
}

export interface UseWebRtcCallResult extends WebRtcCallState, WebRtcCallControls {
  signalingClient: CallSignalingClient;
}

export function useWebRtcCall(options: UseWebRtcCallOptions): UseWebRtcCallResult {
  const { signaling, localUserId, localDisplayName, localAvatarUrl, iceServers } = options;

  const [session, setSession] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const signalingClientRef = useRef<CallSignalingClient | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const pendingRemoteOfferRef = useRef<CallOfferSignal | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);

  if (!signalingClientRef.current) {
    signalingClientRef.current = new CallSignalingClient(signaling);
    signalingClientRef.current.connect();
  }
  const signalingClient = signalingClientRef.current;

  const iceConfig = useMemo<RTCConfiguration>(
    () => ({
      iceServers: iceServers ?? [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    }),
    [iceServers]
  );

  const ensurePeerConnection = useCallback(() => {
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
      } catch (err) {
        logger.error('Failed to send ICE candidate', err);
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) {
        return;
      }
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      logger.debug('Peer connection state', { state: pc.connectionState });
      if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'closed'
      ) {
        setStatus((prev: CallStatus) => (prev === 'ended' ? prev : 'failed'));
      }
    };

    peerRef.current = pc;
    return pc;
  }, [iceConfig, localUserId, signalingClient]);

  const stopLocalStream = useCallback(() => {
    setLocalStream((prev) => {
      if (prev) {
        prev.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
  }, []);

  const cleanupPeer = useCallback(() => {
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
      if (prev) {
        prev.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
  }, []);

  const resetSession = useCallback(
    (reason?: string) => {
      stopLocalStream();
      cleanupPeer();
      currentCallIdRef.current = null;
      remoteUserIdRef.current = null;
      pendingRemoteOfferRef.current = null;

      setSession((prev: CallSession | null) =>
        prev
          ? {
              ...prev,
              status: reason ? 'failed' : 'ended',
              endedAt: new Date().toISOString(),
              failureReason: reason ?? prev.failureReason,
            }
          : null
      );
      setStatus(reason ? 'failed' : 'ended');
      setIsMuted(false);
      setIsCameraOff(false);
      setIsScreenSharing(false);
    },
    [cleanupPeer, stopLocalStream]
  );

  const attachLocalStream = useCallback(
    (stream: MediaStream) => {
      setLocalStream(stream);
      const pc = ensurePeerConnection();
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    },
    [ensurePeerConnection]
  );

  const createLocalMedia = useCallback(
    async (constraints?: MediaStreamConstraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(
        constraints ?? {
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        }
      );
      attachLocalStream(stream);
      return stream;
    },
    [attachLocalStream]
  );

  const buildSessionParticipants = useCallback(
    (
      direction: CallDirection,
      remoteUserId: string,
      remoteDisplayName: string,
      remoteAvatarUrl?: string | null
    ): CallSession => ({
      id: currentCallIdRef.current ?? crypto.randomUUID(),
      kind: 'direct',
      direction,
      status: 'ringing',
      localParticipant: {
        id: localUserId,
        displayName: localDisplayName,
        avatarUrl: localAvatarUrl,
        isLocal: true,
        microphone: 'enabled',
        camera: 'enabled',
      },
      remoteParticipant: {
        id: remoteUserId,
        displayName: remoteDisplayName,
        avatarUrl: remoteAvatarUrl ?? null,
        isLocal: false,
        microphone: 'enabled',
        camera: 'enabled',
      },
      startedAt: new Date().toISOString(),
    }),
    [localAvatarUrl, localDisplayName, localUserId]
  );

  const startOutgoingCall = useCallback<UseWebRtcCallResult['startOutgoingCall']>(
    async ({ callId, remoteUserId, remoteDisplayName, remoteAvatarUrl }) => {
      try {
        currentCallIdRef.current = callId;
        remoteUserIdRef.current = remoteUserId;

        const pc = ensurePeerConnection();
        const stream = await createLocalMedia();
        logger.debug('Created local media stream for outgoing call', {
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length,
        });

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
        setSession(sessionState);
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
        const error = err as Error;
        logger.error('Failed to start outgoing call', error);
        resetSession(error.message);
      }
    },
    [
      buildSessionParticipants,
      createLocalMedia,
      ensurePeerConnection,
      localUserId,
      resetSession,
      signalingClient,
    ]
  );

  const handleIncomingOffer = useCallback<UseWebRtcCallResult['handleIncomingOffer']>(
    (signal) => {
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
        setSession(incomingSession);
        setStatus('ringing');
      } catch (err) {
        const error = err as Error;
        logger.error('Failed to handle incoming offer', error);
        resetSession(error.message);
      }
    },
    [buildSessionParticipants, resetSession]
  );

  const acceptIncomingCall = useCallback(async () => {
    const offer = pendingRemoteOfferRef.current;
    const callId = currentCallIdRef.current;
    const remoteUserId = remoteUserIdRef.current;
    if (!offer || !callId || !remoteUserId) {
      return;
    }

    try {
      const pc = ensurePeerConnection();
      const stream = await createLocalMedia();
      logger.debug('Created local media stream for incoming call', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
      });

      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: offer.sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setStatus('connecting');
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'connecting',
              startedAt: prev.startedAt ?? new Date().toISOString(),
            }
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
      const error = err as Error;
      logger.error('Failed to accept incoming call', error);
      resetSession(error.message);
    }
  }, [createLocalMedia, ensurePeerConnection, localUserId, resetSession, signalingClient]);

  const rejectIncomingCall = useCallback<UseWebRtcCallResult['rejectIncomingCall']>(
    (reason) => {
      const callId = currentCallIdRef.current;
      const remoteUserId = remoteUserIdRef.current;
      if (!callId || !remoteUserId) {
        return;
      }
      try {
        signalingClient.send({
          type: 'call-reject',
          callId,
          fromUserId: localUserId,
          toUserId: remoteUserId,
          reason,
        });
      } catch (err) {
        logger.error('Failed to reject call', err);
      } finally {
        resetSession(reason ?? 'Call rejected');
      }
    },
    [localUserId, resetSession, signalingClient]
  );

  const endCall = useCallback<UseWebRtcCallResult['endCall']>(
    (reason) => {
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
        } catch (err) {
          logger.error('Failed to end call', err);
        }
      }
      resetSession(reason);
    },
    [localUserId, resetSession, signalingClient]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      setSession((prevSession: CallSession | null) =>
        prevSession
          ? {
              ...prevSession,
              localParticipant: {
                ...prevSession.localParticipant,
                microphone: next ? 'muted' : 'enabled',
              },
            }
          : prevSession
      );
      return next;
    });
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    setIsCameraOff((prev) => {
      const next = !prev;
      if (localStream) {
        localStream.getVideoTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      setSession((prevSession: CallSession | null) =>
        prevSession
          ? {
              ...prevSession,
              localParticipant: {
                ...prevSession.localParticipant,
                camera: next ? 'off' : 'enabled',
              },
            }
          : prevSession
      );
      return next;
    });
  }, [localStream]);

  const toggleScreenShare = useCallback(async () => {
    const pc = peerRef.current;
    if (!pc) {
      return;
    }
    if (isScreenSharing) {
      setIsScreenSharing(false);
      if (!localStream) {
        return;
      }
      const cameraTrack = localStream.getVideoTracks()[0];
      if (!cameraTrack) {
        return;
      }
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(cameraTrack);
      }
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const [displayTrack] = displayStream.getVideoTracks();
      if (!displayTrack) {
        return;
      }
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(displayTrack);
      }
      setIsScreenSharing(true);

      displayTrack.onended = async () => {
        setIsScreenSharing(false);
        if (!localStream) {
          return;
        }
        const originalTrack = localStream.getVideoTracks()[0];
        if (!originalTrack) {
          return;
        }
        const s = pc.getSenders().find((snd) => snd.track?.kind === 'video');
        if (s) {
          await s.replaceTrack(originalTrack);
        }
      };
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to start screen share', error);
    }
  }, [isScreenSharing, localStream]);

  useEffect(() => {
    const unsubscribe = signalingClient.onSignal(async (signal: CallSignal) => {
      const callId = currentCallIdRef.current;
      if (callId && signal.callId !== callId) {
        return;
      }

      switch (signal.type) {
        case 'call-answer': {
          const pc = ensurePeerConnection();
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: signal.sdp })
          );
          setStatus('in-call');
          setSession((prev: CallSession | null) =>
            prev
              ? {
                  ...prev,
                  status: 'in-call',
                }
              : prev
          );
          break;
        }
        case 'call-candidate': {
          const pc = ensurePeerConnection();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            logger.error('Failed to add ICE candidate', err);
          }
          break;
        }
        case 'call-end': {
          resetSession(signal.reason ?? 'Remote ended call');
          break;
        }
        case 'call-reject': {
          resetSession(signal.reason ?? 'Call rejected');
          break;
        }
        default:
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [ensurePeerConnection, resetSession, signalingClient]);

  useEffect(
    () => () => {
      stopLocalStream();
      cleanupPeer();
      signalingClient.disconnect();
    },
    [cleanupPeer, signalingClient, stopLocalStream]
  );

  return {
    session,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    status,
    signalingClient,
    startOutgoingCall,
    handleIncomingOffer,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  };
}
