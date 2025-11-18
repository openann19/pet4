import type { Call, CallType, GroupCall } from './call-types';
import { logger } from './logger';
import { FixerError } from './fixer-error';
import { createWebRTCPeer, type WebRTCPeer } from './webrtc-peer';

export function generateCallId(): string {
  return `call-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function createCall(
  roomId: string,
  initiatorId: string,
  recipientId: string,
  type: CallType
): Call {
  return {
    id: generateCallId(),
    roomId,
    type,
    initiatorId,
    recipientId,
    status: 'initiating',
    startTime: new Date().toISOString(),
    duration: 0,
    quality: 'excellent',
  };
}

export function formatCallDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function getCallStatusMessage(status: Call['status']): string {
  switch (status) {
    case 'initiating':
      return 'Starting call...';
    case 'ringing':
      return 'Ringing...';
    case 'connecting':
      return 'Connecting...';
    case 'active':
      return 'Call in progress';
    case 'ended':
      return 'Call ended';
    case 'missed':
      return 'Missed call';
    case 'declined':
      return 'Call declined';
    case 'failed':
      return 'Call failed';
    default:
      return '';
  }
}

export type VideoQuality = '4k' | '1080p' | '720p' | '480p';

export interface VideoConstraints {
  width: { ideal: number; max?: number };
  height: { ideal: number; max?: number };
  frameRate: { ideal: number; max?: number };
  facingMode: string;
}

export function getVideoConstraints(quality: VideoQuality = '4k'): VideoConstraints {
  switch (quality) {
    case '4k':
      return {
        width: { ideal: 3840, max: 3840 },
        height: { ideal: 2160, max: 2160 },
        frameRate: { ideal: 60, max: 60 },
        facingMode: 'user',
      };
    case '1080p':
      return {
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        frameRate: { ideal: 60, max: 60 },
        facingMode: 'user',
      };
    case '720p':
      return {
        width: { ideal: 1280, max: 1280 },
        height: { ideal: 720, max: 720 },
        frameRate: { ideal: 30, max: 30 },
        facingMode: 'user',
      };
    case '480p':
      return {
        width: { ideal: 854, max: 854 },
        height: { ideal: 480, max: 480 },
        frameRate: { ideal: 30, max: 30 },
        facingMode: 'user',
      };
  }
}

export async function requestMediaPermissions(
  type: CallType,
  videoQuality: VideoQuality = '4k'
): Promise<MediaStream | null> {
  try {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 2,
      },
      video: type === 'video' ? getVideoConstraints(videoQuality) : false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Failed to get media permissions', err, { type, videoQuality });
    if (videoQuality === '4k' && type === 'video') {
      logger.info('4K not supported, falling back to 1080p', {
        type,
        fromQuality: '4k',
        toQuality: '1080p',
      });
      return requestMediaPermissions(type, '1080p');
    }
    if (videoQuality === '1080p' && type === 'video') {
      logger.info('1080p not supported, falling back to 720p', {
        type,
        fromQuality: '1080p',
        toQuality: '720p',
      });
      return requestMediaPermissions(type, '720p');
    }
    return null;
  }
}

export function getActualResolution(stream: MediaStream): string {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return 'No video';

  const settings = videoTrack.getSettings();
  const width = settings.width ?? 0;
  const height = settings.height ?? 0;
  const frameRate = settings.frameRate ?? 0;

  if (width >= 3840 && height >= 2160) {
    return `4K (${width}x${height} @ ${frameRate}fps)`;
  } else if (width >= 1920 && height >= 1080) {
    return `1080p (${width}x${height} @ ${frameRate}fps)`;
  } else if (width >= 1280 && height >= 720) {
    return `720p (${width}x${height} @ ${frameRate}fps)`;
  }
  return `${width}x${height} @ ${frameRate}fps`;
}

export function stopMediaStream(stream?: MediaStream) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export interface CallConnectionConfig {
  callId: string;
  localUserId: string;
  remoteUserId: string;
  isInitiator: boolean;
  localStream: MediaStream;
  onRemoteStream: (stream: MediaStream) => void;
  onStatusChange: (status: Call['status']) => void;
}

/**
 * Establish a WebRTC peer-to-peer connection using SimplePeer
 */
export async function establishCallConnection(config: CallConnectionConfig): Promise<WebRTCPeer> {
  config.onStatusChange('ringing');

  try {
    const peer = createWebRTCPeer({
      callId: config.callId,
      localUserId: config.localUserId,
      remoteUserId: config.remoteUserId,
      isInitiator: config.isInitiator,
      localStream: config.localStream,
      onRemoteStream: config.onRemoteStream,
      onConnectionStateChange: (state) => {
        if (state === 'connecting') {
          config.onStatusChange('connecting');
        } else if (state === 'connected') {
          config.onStatusChange('active');
        } else if (state === 'failed') {
          config.onStatusChange('failed');
        } else if (state === 'disconnected') {
          config.onStatusChange('ended');
        }
      },
    });

    await peer.connect();

    return peer;
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Failed to establish call connection', err, {
      action: 'establishCallConnection',
      callId: config.callId,
      remoteUserId: config.remoteUserId,
    });
    config.onStatusChange('failed');
    throw new FixerError(
      'Failed to establish call connection',
      {
        action: 'establishCallConnection',
        callId: config.callId,
        remoteUserId: config.remoteUserId,
      },
      'CALL_CONNECTION_ERROR'
    );
  }
}

export function closePeerConnection(peer?: WebRTCPeer | RTCPeerConnection) {
  if (peer && 'destroy' in peer) {
    // WebRTCPeer instance
    peer.destroy();
  } else if (peer && 'close' in peer) {
    // RTCPeerConnection (legacy support)
    peer.close();
  }
}

export function generateAudioWaveform(): number[] {
  return Array.from({ length: 30 }, () => Math.random() * 0.8 + 0.2);
}

export function createGroupCall(
  roomId: string,
  initiatorId: string,
  type: CallType,
  playdateId?: string,
  title?: string
): GroupCall {
  return {
    id: generateCallId(),
    roomId,
    type,
    initiatorId,
    status: 'initiating',
    startTime: new Date().toISOString(),
    duration: 0,
    quality: 'excellent',
    ...(playdateId && { playdateId }),
    ...(title && { title }),
  };
}
