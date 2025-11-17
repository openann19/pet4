/**
 * WebRTC Mock Utilities
 *
 * Mock utilities for WebRTC APIs in tests
 */

import { vi } from 'vitest';

/**
 * Mock RTCPeerConnection
 */
export class MockRTCPeerConnection {
  localDescription: RTCSessionDescriptionInit | null = null;
  remoteDescription: RTCSessionDescriptionInit | null = null;
  signalingState: RTCSignalingState = 'stable';
  iceGatheringState: RTCIceGatheringState = 'new';
  iceConnectionState: RTCIceConnectionState = 'new';
  connectionState: RTCPeerConnectionState = 'new';

  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  onsignalingstatechange: (() => void) | null = null;
  ontrack: ((event: RTCTrackEvent) => void) | null = null;

  addTrack = vi.fn((_track: MediaStreamTrack, ..._streams: MediaStream[]) => {
    return {} as RTCRtpSender;
  });

  removeTrack = vi.fn((_sender: RTCRtpSender) => {
    // Mock implementation
  });

  addTransceiver = vi.fn(
    (_trackOrKind: MediaStreamTrack | string, _init?: RTCRtpTransceiverInit) => {
      return {} as RTCRtpTransceiver;
    }
  );

  createOffer = vi.fn((_options?: RTCOfferOptions) => {
    return Promise.resolve({
      type: 'offer',
      sdp: 'mock-sdp-offer',
    } as RTCSessionDescriptionInit);
  });

  createAnswer = vi.fn((_options?: RTCAnswerOptions) => {
    return Promise.resolve({
      type: 'answer',
      sdp: 'mock-sdp-answer',
    } as RTCSessionDescriptionInit);
  });

  setLocalDescription = vi.fn((description?: RTCSessionDescriptionInit) => {
    if (description) {
      this.localDescription = description;
    }
    return Promise.resolve();
  });

  setRemoteDescription = vi.fn((_description: RTCSessionDescriptionInit) => {
    this.remoteDescription = _description;
    return Promise.resolve();
  });

  addIceCandidate = vi.fn((_candidate?: RTCIceCandidateInit | RTCIceCandidate) => {
    return Promise.resolve();
  });

  getConfiguration = vi.fn(() => (({}) as RTCConfiguration));

  setConfiguration = vi.fn((_configuration: RTCConfiguration) => {
    // Mock implementation
  });

  close = vi.fn(() => {
    this.connectionState = 'closed';
  });

  restartIce = vi.fn(() => {
    // Mock implementation
  });

  getStats = vi.fn((_selector?: MediaStreamTrack | null) => {
    return Promise.resolve(new Map() as unknown as RTCStatsReport);
  });

  getSenders = vi.fn(() => [] as RTCRtpSender[]);

  getReceivers = vi.fn(() => [] as RTCRtpReceiver[]);

  getTransceivers = vi.fn(() => [] as RTCRtpTransceiver[]);

  addEventListener = vi.fn();

  removeEventListener = vi.fn();

  dispatchEvent = vi.fn(() => true);
}

/**
 * Mock MediaStream
 */
export class MockMediaStream {
  id: string;
  active = true;
  tracks: MediaStreamTrack[];

  constructor(tracks?: MediaStreamTrack[]) {
    this.id = `stream-${Math.random().toString(36).substr(2, 9)}`;
    this.tracks = tracks ?? [];
  }

  addTrack = vi.fn((track: MediaStreamTrack) => {
    this.tracks.push(track);
  });

  removeTrack = vi.fn((track: MediaStreamTrack) => {
    const index = this.tracks.indexOf(track);
    if (index > -1) {
      this.tracks.splice(index, 1);
    }
  });

  getTracks = vi.fn(() => this.tracks);

  getAudioTracks = vi.fn(() => this.tracks.filter((t) => t.kind === 'audio'));

  getVideoTracks = vi.fn(() => this.tracks.filter((t) => t.kind === 'video'));

  getTrackById = vi.fn((trackId: string) => {
    return this.tracks.find((t) => t.id === trackId) ?? null;
  });

  clone = vi.fn(() => {
    return new MockMediaStream([...this.tracks]);
  });

  addEventListener = vi.fn();

  removeEventListener = vi.fn();

  dispatchEvent = vi.fn(() => true);

  onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => unknown) | null = null;
  onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => unknown) | null = null;
}

/**
 * Mock MediaStreamTrack
 */
type MockTrackKind = MediaStreamTrack['kind'];

export class MockMediaStreamTrack {
  id: string;
  kind: MockTrackKind;
  label = '';
  enabled = true;
  muted = false;
  readyState: MediaStreamTrackState = 'live';
  contentHint = '';
  settings: MediaTrackSettings = {};
  capabilities: MediaTrackCapabilities = {};

  constructor(kind: MockTrackKind, id?: string) {
    this.kind = kind;
    this.id = id ?? `track-${Math.random().toString(36).substr(2, 9)}`;
  }

  clone = vi.fn(() => {
    return new MockMediaStreamTrack(this.kind, this.id);
  });

  stop = vi.fn(() => {
    this.readyState = 'ended';
  });

  getConstraints = vi.fn(() => (({}) as MediaTrackConstraints));

  applyConstraints = vi.fn(() => Promise.resolve());

  getCapabilities = vi.fn(() => (({}) as MediaTrackCapabilities));

  getSettings = vi.fn(() => (({}) as MediaTrackSettings));

  addEventListener = vi.fn();

  removeEventListener = vi.fn();

  dispatchEvent = vi.fn(() => true);

  onended: ((this: MediaStreamTrack, ev: Event) => unknown) | null = null;
  onmute: ((this: MediaStreamTrack, ev: Event) => unknown) | null = null;
  onunmute: ((this: MediaStreamTrack, ev: Event) => unknown) | null = null;
}

/**
 * Setup WebRTC mocks globally
 */
export function setupWebRTCMocks(): void {
  // Mock getUserMedia
  Object.defineProperty(global.navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn(() => {
        return Promise.resolve(
          new MockMediaStream([
            new MockMediaStreamTrack('audio'),
            new MockMediaStreamTrack('video'),
          ])
        );
      }),
      enumerateDevices: vi.fn(() => {
        return Promise.resolve([] as MediaDeviceInfo[]);
      }),
      getSupportedConstraints: vi.fn(() => (({}) as MediaTrackSupportedConstraints)),
    } satisfies Partial<MediaDevices>,
  });

  // Mock RTCPeerConnection
  global.RTCPeerConnection =
    MockRTCPeerConnection as unknown as typeof globalThis.RTCPeerConnection;
  global.MediaStream = MockMediaStream as unknown as typeof globalThis.MediaStream;
  global.MediaStreamTrack = MockMediaStreamTrack as unknown as typeof globalThis.MediaStreamTrack;
}
