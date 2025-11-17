/**
 * Call Session Hook (Mobile)
 *
 * Manages call session state and WebRTC connection for mobile
 */

import { useState, useCallback, useRef } from 'react';
import { useWebRTC } from './call/use-web-rtc';
import type {
  CallSession,
  CallParticipant,
  VideoQuality,
} from '@petspark/core';
import type {
  MediaStream,
  RTCSessionDescriptionInit,
  RTCIceServer,
} from '@/types/webrtc';
import { createLogger } from '@/utils/logger';
import * as Haptics from 'expo-haptics';

const logger = createLogger('useCallSession');

export interface UseCallSessionOptions {
  localUserId: string;
  localDisplayName: string;
  localAvatarUrl?: string | null;
  iceServers?: RTCIceServer[];
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: 'connecting' | 'connected' | 'disconnected' | 'failed') => void;
  onError?: (error: Error) => void;
}

export interface UseCallSessionResult {
  session: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  videoQuality: VideoQuality;
  startCall: (params: {
    callId: string;
    remoteUserId: string;
    remoteDisplayName: string;
    remoteAvatarUrl?: string | null;
    quality?: VideoQuality;
  }) => Promise<void>;
  acceptCall: (params: {
    callId: string;
    remoteUserId: string;
    remoteDisplayName: string;
    remoteAvatarUrl?: string | null;
    offer: RTCSessionDescriptionInit;
    quality?: VideoQuality;
  }) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  setVideoQuality: (quality: VideoQuality) => Promise<void>;
}

export function useCallSession(
  options: UseCallSessionOptions
): UseCallSessionResult {
  const {
    localUserId,
    localDisplayName,
    localAvatarUrl,
    iceServers,
    onRemoteStream,
    onConnectionStateChange,
    onError,
  } = options;

  const [session, setSession] = useState<CallSession | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  // Type-safe: VideoQuality is a string union type, '720p' is a valid literal
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [videoQuality, setVideoQualityState] = useState<VideoQuality>('720p');

  const callIdRef = useRef<string | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);

  const stunServers: { urls: string | string[] }[] =
    iceServers?.filter((s) => {
      const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
      return urls.some((url) => typeof url === 'string' && url.includes('stun:'));
    }) ?? [{ urls: 'stun:stun.l.google.com:19302' }];

  const { callState, toggleMute: webrtcToggleMute, toggleCamera: webrtcToggleCamera, endCall: webrtcEndCall } = useWebRTC({
    callId: callIdRef.current ?? '',
    remoteUserId: remoteUserIdRef.current ?? '',
    isCaller: false,
    stunServers,
    onRemoteStream: (stream) => {
      onRemoteStream?.(stream);
    },
    onConnectionStateChange: (state) => {
      if (state === 'connected') {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                status: 'in-call',
              }
            : null
        );
      }
      onConnectionStateChange?.(state);
    },
  });

  const createLocalParticipant = useCallback(
    (): CallParticipant => ({
      id: localUserId,
      displayName: localDisplayName,
      avatarUrl: localAvatarUrl ?? null,
      isLocal: true,
      microphone: isMuted ? 'muted' : 'enabled',
      camera: isCameraOff ? 'off' : 'enabled',
    }),
    [localUserId, localDisplayName, localAvatarUrl, isMuted, isCameraOff]
  );

  const startCall = useCallback<UseCallSessionResult['startCall']>(
    ({ callId, remoteUserId, remoteDisplayName, remoteAvatarUrl, quality = '720p' }) => {
      try {
        callIdRef.current = callId;
        remoteUserIdRef.current = remoteUserId;
        setVideoQualityState(quality);

        const remoteParticipant: CallParticipant = {
          id: remoteUserId,
          displayName: remoteDisplayName,
          avatarUrl: remoteAvatarUrl ?? null,
          isLocal: false,
          microphone: 'enabled',
          camera: 'enabled',
        };

        const newSession: CallSession = {
          id: callId,
          kind: 'direct',
          direction: 'outgoing',
          status: 'ringing',
          localParticipant: createLocalParticipant(),
          remoteParticipant,
          startedAt: new Date().toISOString(),
        };

        setSession(newSession);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
          // Ignore haptic errors
        });

        logger.debug('Call started', { callId, remoteUserId, quality } as Record<string, unknown>);
        return Promise.resolve();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to start call', err);
        onError?.(err);
        setSession(null);
        return Promise.reject(err);
      }
    },
    [createLocalParticipant, onError]
  );

  const acceptCall = useCallback<UseCallSessionResult['acceptCall']>(
    ({ callId, remoteUserId, remoteDisplayName, remoteAvatarUrl, offer: _offer, quality = '720p' }) => {
      try {
        callIdRef.current = callId;
        remoteUserIdRef.current = remoteUserId;
        setVideoQualityState(quality);

        const remoteParticipant: CallParticipant = {
          id: remoteUserId,
          displayName: remoteDisplayName,
          avatarUrl: remoteAvatarUrl ?? null,
          isLocal: false,
          microphone: 'enabled',
          camera: 'enabled',
        };

        const newSession: CallSession = {
          id: callId,
          kind: 'direct',
          direction: 'incoming',
          status: 'connecting',
          localParticipant: createLocalParticipant(),
          remoteParticipant,
          startedAt: new Date().toISOString(),
        };

        setSession(newSession);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
          // Ignore haptic errors
        });

        logger.debug('Call accepted', { callId, remoteUserId, quality } as Record<string, unknown>);
        return Promise.resolve();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to accept call', err);
        onError?.(err);
        setSession(null);
        return Promise.reject(err);
      }
    },
    [createLocalParticipant, onError]
  );

  const endCall = useCallback(() => {
    void webrtcEndCall();
    setSession((prev) =>
      prev
        ? {
            ...prev,
            status: 'ended',
            endedAt: new Date().toISOString(),
          }
        : null
    );
    setIsMuted(false);
    setIsCameraOff(false);
    callIdRef.current = null;
    remoteUserIdRef.current = null;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
      // Ignore haptic errors
    });
  }, [webrtcEndCall]);

  const toggleMute = useCallback(() => {
    webrtcToggleMute();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setSession((prev) =>
      prev
        ? {
            ...prev,
            localParticipant: {
              ...prev.localParticipant,
              microphone: newMuted ? 'muted' : 'enabled',
            },
          }
        : null
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      // Ignore haptic errors
    });
  }, [isMuted, webrtcToggleMute]);

  const toggleCamera = useCallback(() => {
    webrtcToggleCamera();
    const newCameraOff = !isCameraOff;
    setIsCameraOff(newCameraOff);
    setSession((prev) =>
      prev
        ? {
            ...prev,
            localParticipant: {
              ...prev.localParticipant,
              camera: newCameraOff ? 'off' : 'enabled',
            },
          }
        : null
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      // Ignore haptic errors
    });
  }, [isCameraOff, webrtcToggleCamera]);

  const setVideoQuality = useCallback(
    (quality: VideoQuality) => {
      setVideoQualityState(quality);
      logger.debug('Video quality changed', { quality } as Record<string, unknown>);
      return Promise.resolve();
    },
    []
  );

  return {
    session,
    localStream: callState.localStream,
    remoteStream: callState.remoteStream,
    isMuted,
    isCameraOff,
    // Type-safe: videoQuality is VideoQuality from useState above
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    videoQuality,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleCamera,
    setVideoQuality,
  };
}

