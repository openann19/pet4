/**
 * Type definitions for expo-av
 *
 * These types define the structure of the expo-av module
 * when imported dynamically.
 */

/**
 * AV Playback Status
 */
export interface AVPlaybackStatus {
  isLoaded: boolean;
  uri?: string;
  progressUpdateIntervalMillis?: number;
  durationMillis?: number;
  positionMillis?: number;
  playableDurationMillis?: number;
  shouldPlay?: boolean;
  isPlaying?: boolean;
  isBuffering?: boolean;
  rate?: number;
  shouldCorrectPitch?: boolean;
  volume?: number;
  isMuted?: boolean;
  isLooping?: boolean;
  didJustFinish?: boolean;
  error?: string;
}

/**
 * AV Playback Source
 */
export interface AVPlaybackSource {
  uri: string;
  overrideFileExtensionAndroid?: string;
  headers?: Record<string, string>;
}

/**
 * Video Component Props
 */
export interface VideoProps {
  source: AVPlaybackSource | number;
  style?: unknown;
  resizeMode?: ResizeMode;
  useNativeControls?: boolean;
  shouldPlay?: boolean;
  isLooping?: boolean;
  isMuted?: boolean;
  volume?: number;
  rate?: number;
  onLoadStart?: () => void;
  onLoad?: (status: AVPlaybackStatus) => void;
  onError?: (error: { error: string }) => void;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  progressUpdateIntervalMillis?: number;
  positionMillis?: number;
  ref?: unknown;
}

/**
 * Video Component Interface
 */
export interface VideoComponent {
  playAsync(): Promise<AVPlaybackStatus>;
  pauseAsync(): Promise<AVPlaybackStatus>;
  stopAsync(): Promise<AVPlaybackStatus>;
  setPositionAsync(positionMillis: number): Promise<AVPlaybackStatus>;
  setRateAsync(rate: number, shouldCorrectPitch?: boolean): Promise<AVPlaybackStatus>;
  setVolumeAsync(volume: number): Promise<AVPlaybackStatus>;
  setIsMutedAsync(isMuted: boolean): Promise<AVPlaybackStatus>;
  setIsLoopingAsync(isLooping: boolean): Promise<AVPlaybackStatus>;
  setProgressUpdateIntervalAsync(progressUpdateIntervalMillis: number): Promise<AVPlaybackStatus>;
  replayAsync(): Promise<AVPlaybackStatus>;
  getStatusAsync(): Promise<AVPlaybackStatus>;
  unloadAsync(): Promise<void>;
  reloadAsync(): Promise<void>;
}

/**
 * Resize Mode enum
 */
export enum ResizeMode {
  CONTAIN = 'contain',
  COVER = 'cover',
  STRETCH = 'stretch',
}

/**
 * Expo AV Module exports
 */
export interface ExpoAVModule {
  Video: React.ComponentType<VideoProps> & VideoComponent;
  ResizeMode: typeof ResizeMode;
  AVPlaybackStatus: typeof AVPlaybackStatus;
}

declare module 'expo-av' {
  import type { ComponentType } from 'react';

  const Video: ComponentType<VideoProps> & VideoComponent;
  const ResizeMode: typeof ResizeMode;
  const AVPlaybackStatus: typeof AVPlaybackStatus;

  export { Video, ResizeMode, AVPlaybackStatus };
  export type { VideoProps, AVPlaybackStatus, AVPlaybackSource };
}
