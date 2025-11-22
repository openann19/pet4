/**
 * Call Client
 *
 * WebRTC client with quality presets for video calling
 */

import type { VideoQuality, VideoConstraints } from './call-types';
import { VIDEO_QUALITY_PRESETS } from './call-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CallClient');

export interface CallClientConfig {
  iceServers?: RTCIceServer[];
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
}

export interface MediaStreamConfig {
  audio: boolean;
  video: boolean | VideoConstraints;
}

export class CallClient {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentQuality: VideoQuality = '720p';
  private config: CallClientConfig;

  constructor(config: CallClientConfig) {
    this.config = config;
  }

  /**
   * Get video constraints for a quality preset
   */
  getVideoConstraints(quality: VideoQuality): MediaStreamConstraints['video'] {
    const preset = VIDEO_QUALITY_PRESETS[quality];
    return {
      width: preset.constraints.width,
      height: preset.constraints.height,
      frameRate: preset.constraints.frameRate,
      facingMode: preset.constraints.facingMode,
    };
  }

  /**
   * Request media stream with quality preset
   */
  async requestMediaStream(quality: VideoQuality = '720p'): Promise<MediaStream> {
    this.currentQuality = quality;
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 2,
      },
      video: this.getVideoConstraints(quality),
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      logger.debug('Media stream obtained', { quality, tracks: stream.getTracks().length });
      return stream;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get media stream', err, { quality });

      // Fallback to lower quality
      if (quality === '4k') {
        logger.info('4K not supported, falling back to 1080p');
        return this.requestMediaStream('1080p');
      }
      if (quality === '1080p') {
        logger.info('1080p not supported, falling back to 720p');
        return this.requestMediaStream('720p');
      }
      if (quality === '720p') {
        logger.info('720p not supported, falling back to 480p');
        return this.requestMediaStream('480p');
      }

      throw err;
    }
  }

  /**
   * Request screen share stream
   */
  async requestScreenShare(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      logger.debug('Screen share stream obtained');
      return stream;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get screen share', err);
      throw err;
    }
  }

  /**
   * Create peer connection
   */
  createPeerConnection(): RTCPeerConnection {
    if (this.peerConnection && this.peerConnection.connectionState !== 'closed') {
      return this.peerConnection;
    }

    const iceServers = this.config.iceServers ?? [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    const pc = new RTCPeerConnection({
      iceServers,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        logger.debug('ICE candidate generated', { candidate: event.candidate.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      logger.debug('Connection state changed', { state: pc.connectionState });
      if (this.config.onConnectionStateChange) {
        this.config.onConnectionStateChange(pc.connectionState);
      }

      if (pc.connectionState === 'failed') {
        if (this.config.onError) {
          this.config.onError(new Error('Peer connection failed'));
        }
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        this.remoteStream = stream;
        logger.debug('Remote stream received', { tracks: stream.getTracks().length });
        if (this.config.onRemoteStream) {
          this.config.onRemoteStream(stream);
        }
      }
    };

    this.peerConnection = pc;
    return pc;
  }

  /**
   * Add local stream to peer connection
   */
  addLocalStream(stream: MediaStream): void {
    const pc = this.peerConnection ?? this.createPeerConnection();
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
    this.localStream = stream;
  }

  /**
   * Create offer
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnection ?? this.createPeerConnection();
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(offer);
    return offer;
  }

  /**
   * Create answer
   */
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnection;
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * Handle offer
   */
  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    const pc = this.peerConnection ?? this.createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    return this.createAnswer();
  }

  /**
   * Handle answer
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnection;
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnection;
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  /**
   * Toggle mute
   */
  toggleMute(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Toggle camera
   */
  toggleCamera(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Replace video track (for screen sharing)
   */
  async replaceVideoTrack(newTrack: MediaStreamTrack): Promise<void> {
    const pc = this.peerConnection;
    if (!pc) {
      throw new Error('Peer connection not initialized');
    }

    const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
    if (sender) {
      await sender.replaceTrack(newTrack);
    }
  }

  /**
   * Get current quality
   */
  getCurrentQuality(): VideoQuality {
    return this.currentQuality;
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Get peer connection
   */
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  /**
   * Close and cleanup
   */
  close(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}

