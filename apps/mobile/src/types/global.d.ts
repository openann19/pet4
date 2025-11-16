/**
 * Global type declarations for mobile app
 */

// MediaStream global type for WebRTC
declare global {
  interface MediaStream {
    id: string;
    active: boolean;
    getTracks(): MediaStreamTrack[];
    getAudioTracks(): MediaStreamTrack[];
    getVideoTracks(): MediaStreamTrack[];
    addTrack(track: MediaStreamTrack): void;
    removeTrack(track: MediaStreamTrack): void;
    getTrackById(trackId: string): MediaStreamTrack | null;
    clone(): MediaStream;
    toURL(): string;
  }

  interface MediaStreamTrack {
    id: string;
    kind: 'audio' | 'video';
    label: string;
    enabled: boolean;
    muted: boolean;
    readyState: 'live' | 'ended';
    stop(): void;
    clone(): MediaStreamTrack;
  }
}

export {};

