/**
 * Type declarations for react-native-webrtc
 * This is a stub to prevent TypeScript errors until the package is installed
 * Location: apps/mobile/src/types/react-native-webrtc.d.ts
 */

declare module 'react-native-webrtc' {
  import type { ComponentType } from 'react';
  import type { ViewStyle } from 'react-native';

  export interface RTCViewProps {
    streamURL?: string;
    objectFit?: 'contain' | 'cover';
    mirror?: boolean;
    style?: ViewStyle;
    zOrder?: number;
  }

  export const RTCView: ComponentType<RTCViewProps>;

  export interface MediaStream {
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

  export interface MediaStreamTrack {
    id: string;
    kind: 'audio' | 'video';
    label: string;
    enabled: boolean;
    muted: boolean;
    readyState: 'live' | 'ended';
    stop(): void;
    clone(): MediaStreamTrack;
  }

  export interface RTCPeerConnection {
    localDescription: RTCSessionDescription | null;
    remoteDescription: RTCSessionDescription | null;
    signalingState: string;
    iceConnectionState: string;
    connectionState: string;
    addTrack(track: MediaStreamTrack, stream: MediaStream): RTCRtpSender;
    removeTrack(sender: RTCRtpSender): void;
    createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>;
    setLocalDescription(description: RTCSessionDescriptionInit): Promise<void>;
    setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
    addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
    close(): void;
  }

  export interface RTCSessionDescription {
    type: 'offer' | 'answer' | 'pranswer' | 'rollback';
    sdp: string;
    toJSON(): RTCSessionDescriptionInit;
  }

  export interface RTCSessionDescriptionInit {
    type: 'offer' | 'answer' | 'pranswer' | 'rollback';
    sdp?: string;
  }

  export interface RTCIceCandidate {
    candidate: string;
    sdpMLineIndex: number | null;
    sdpMid: string | null;
    toJSON(): RTCIceCandidateInit;
  }

  export interface RTCIceCandidateInit {
    candidate?: string;
    sdpMLineIndex?: number | null;
    sdpMid?: string | null;
  }

  export interface RTCRtpSender {
    track: MediaStreamTrack | null;
    replaceTrack(track: MediaStreamTrack | null): Promise<void>;
  }

  export interface RTCOfferOptions {
    offerToReceiveAudio?: boolean;
    offerToReceiveVideo?: boolean;
    iceRestart?: boolean;
  }

  export interface RTCAnswerOptions {
    // Empty for now
  }

  export interface MediaDevices {
    getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
    getDisplayMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
    enumerateDevices(): Promise<MediaDeviceInfo[]>;
  }

  export interface MediaStreamConstraints {
    audio?: boolean | MediaTrackConstraints;
    video?: boolean | MediaTrackConstraints;
  }

  export interface MediaTrackConstraints {
    width?: number | { min?: number; max?: number; ideal?: number };
    height?: number | { min?: number; max?: number; ideal?: number };
    facingMode?: 'user' | 'environment' | 'left' | 'right';
    deviceId?: string;
  }

  export interface MediaDeviceInfo {
    deviceId: string;
    kind: 'audioinput' | 'audiooutput' | 'videoinput';
    label: string;
    groupId: string;
  }

  export const mediaDevices: MediaDevices;
}
