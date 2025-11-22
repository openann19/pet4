/**
 * Live Streaming Module
 *
 * Complete WebRTC-based streaming solution with quality adaptation
 */

export { useWebRTC } from './use-webrtc';
export type {
  WebRTCConfig,
  WebRTCState,
  ConnectionStats,
} from './use-webrtc';

export { useStreamQuality } from './use-stream-quality';
export type {
  QualityLevel,
  QualityPreset,
  StreamQualityConfig,
  StreamQualityState,
  NetworkStats,
} from './use-stream-quality';

export { useLiveStream } from './use-live-stream';
export type {
  LiveStreamConfig,
  StreamMediaConfig,
  ChatMessage,
  StreamViewer,
  LiveStreamState,
  RecordingOptions,
} from './use-live-stream';
