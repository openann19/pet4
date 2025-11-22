/**
 * Call Types
 *
 * TypeScript types for video calling system
 */

export type VideoQuality = '4k' | '1080p' | '720p' | '480p';

export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'in-call' | 'ended' | 'failed';

export type CallDirection = 'incoming' | 'outgoing';

export interface CallParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  isLocal: boolean;
  microphone: 'enabled' | 'muted';
  camera: 'enabled' | 'off';
  isScreenSharing?: boolean;
}

export interface CallSession {
  id: string;
  kind: 'direct' | 'group';
  direction: CallDirection;
  status: CallStatus;
  localParticipant: CallParticipant;
  remoteParticipant?: CallParticipant;
  participants?: CallParticipant[];
  startedAt: string;
  endedAt?: string;
  failureReason?: string;
}

export interface VideoConstraints {
  width: { ideal: number; max?: number };
  height: { ideal: number; max?: number };
  frameRate: { ideal: number; max?: number };
  facingMode: 'user' | 'environment';
}

export interface CallQualityPreset {
  label: string;
  value: VideoQuality;
  constraints: VideoConstraints;
  bandwidth: number;
}

export const VIDEO_QUALITY_PRESETS: Record<VideoQuality, CallQualityPreset> = {
  '4k': {
    label: '4K Ultra HD',
    value: '4k',
    constraints: {
      width: { ideal: 3840, max: 3840 },
      height: { ideal: 2160, max: 2160 },
      frameRate: { ideal: 60, max: 60 },
      facingMode: 'user',
    },
    bandwidth: 20000000,
  },
  '1080p': {
    label: '1080p Full HD',
    value: '1080p',
    constraints: {
      width: { ideal: 1920, max: 1920 },
      height: { ideal: 1080, max: 1080 },
      frameRate: { ideal: 60, max: 60 },
      facingMode: 'user',
    },
    bandwidth: 5000000,
  },
  '720p': {
    label: '720p HD',
    value: '720p',
    constraints: {
      width: { ideal: 1280, max: 1280 },
      height: { ideal: 720, max: 720 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: 'user',
    },
    bandwidth: 2500000,
  },
  '480p': {
    label: '480p SD',
    value: '480p',
    constraints: {
      width: { ideal: 854, max: 854 },
      height: { ideal: 480, max: 480 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: 'user',
    },
    bandwidth: 1000000,
  },
};

