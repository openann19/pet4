/**
 * Type definitions for react-native-webrtc
 *
 * These types define the structure of the react-native-webrtc module
 * when imported dynamically. Based on the WebRTC standard API.
 * Location: apps/mobile/src/types/webrtc.d.ts
 */

/**
 * Media stream track interface
 */
export interface MediaStreamTrack {
  enabled: boolean
  id: string
  kind: 'audio' | 'video'
  label: string
  muted: boolean
  readonly: boolean
  readyState: 'live' | 'ended'
  stop(): void
}

/**
 * Media stream interface
 */
export interface MediaStream {
  id: string
  active: boolean
  getTracks(): MediaStreamTrack[]
  getAudioTracks(): MediaStreamTrack[]
  getVideoTracks(): MediaStreamTrack[]
  getTrackById(trackId: string): MediaStreamTrack | null
  addTrack(track: MediaStreamTrack): void
  removeTrack(track: MediaStreamTrack): void
  clone(): MediaStream
  toURL(): string
}

/**
 * RTC Ice Candidate interface
 */
export interface RTCIceCandidateInit {
  candidate?: string
  sdpMLineIndex?: number | null
  sdpMid?: string | null
  usernameFragment?: string | null
}

/**
 * RTC Ice Candidate class
 */
export interface RTCIceCandidate {
  candidate: string
  component: 'rtp' | 'rtcp' | null
  foundation: string | null
  ip: string | null
  port: number | null
  priority: number | null
  protocol: 'tcp' | 'udp' | null
  relatedAddress: string | null
  relatedPort: number | null
  sdpMLineIndex: number | null
  sdpMid: string | null
  tcpType: 'active' | 'passive' | 'so' | null
  type: 'host' | 'srflx' | 'prflx' | 'relay' | null
  usernameFragment: string | null
  toJSON(): RTCIceCandidateInit
}

/**
 * RTC Session Description interface
 */
export interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback'
  sdp?: string
}

/**
 * RTC Session Description class
 */
export interface RTCSessionDescription {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback' | null
  sdp: string
  toJSON(): RTCSessionDescriptionInit
}

/**
 * RTC Configuration
 */
export interface RTCConfiguration {
  iceServers?: RTCIceServer[]
  iceTransportPolicy?: 'relay' | 'all'
  bundlePolicy?: 'balanced' | 'max-compat' | 'max-bundle'
  rtcpMuxPolicy?: 'negotiate' | 'require'
  peerIdentity?: string
  certificates?: RTCCertificate[]
  iceCandidatePoolSize?: number
}

/**
 * RTC Ice Server
 */
export interface RTCIceServer {
  urls: string | string[]
  username?: string
  credential?: string
  credentialType?: 'password'
}

/**
 * RTC Certificate (minimal definition)
 */
export interface RTCCertificate {
  expires: number
  getFingerprints(): RTCDtlsFingerprint[]
}

/**
 * RTC DTLS Fingerprint (minimal definition)
 */
export interface RTCDtlsFingerprint {
  algorithm: string
  value: string
}

/**
 * RTCPeerConnection event handlers
 */
export interface RTCPeerConnectionEventHandlers {
  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null
  oniceconnectionstatechange: (() => void) | null
  onconnectionstatechange: (() => void) | null
  onnegotiationneeded: (() => void) | null
  ontrack: ((event: RTCTrackEvent) => void) | null
  ondatachannel: ((event: RTCDataChannelEvent) => void) | null
}

/**
 * RTCPeerConnection Ice Event
 */
export interface RTCPeerConnectionIceEvent {
  candidate: RTCIceCandidate | null
  url?: string
}

/**
 * RTC Track Event
 */
export interface RTCTrackEvent {
  receiver: RTCRtpReceiver
  track: MediaStreamTrack
  streams: MediaStream[]
  transceiver: RTCRtpTransceiver
}

/**
 * RTC Data Channel Event
 */
export interface RTCDataChannelEvent {
  channel: RTCDataChannel
}

/**
 * RTC RTP Receiver
 */
export interface RTCRtpReceiver {
  track: MediaStreamTrack
  transport: RTCDtlsTransport | null
}

/**
 * RTC RTP Transceiver
 */
export interface RTCRtpTransceiver {
  direction: 'sendrecv' | 'sendonly' | 'recvonly' | 'inactive' | 'stopped'
  currentDirection: 'sendrecv' | 'sendonly' | 'recvonly' | 'inactive' | null
  mid: string | null
  receiver: RTCRtpReceiver
  sender: RTCRtpSender
  stopped: boolean
}

/**
 * RTC RTP Sender
 */
export interface RTCRtpSender {
  track: MediaStreamTrack | null
  transport: RTCDtlsTransport | null
  getParameters(): RTCRtpSendParameters
  setParameters(parameters: RTCRtpSendParameters): Promise<void>
  replaceTrack(track: MediaStreamTrack | null): Promise<void>
}

/**
 * RTC RTP Send Parameters
 */
export interface RTCRtpSendParameters {
  transactionId: string
  encodings: RTCRtpEncodingParameters[]
  headerExtensions: RTCRtpHeaderExtensionParameters[]
  rtcp: RTCRtcpParameters
  codecs: RTCRtpCodecParameters[]
}

/**
 * RTC RTP Encoding Parameters
 */
export interface RTCRtpEncodingParameters {
  active?: boolean
  maxBitrate?: number
  maxFramerate?: number
  rid?: string
  scaleResolutionDownBy?: number
}

/**
 * RTC RTP Header Extension Parameters
 */
export interface RTCRtpHeaderExtensionParameters {
  uri: string
  id: number
  encrypted?: boolean
}

/**
 * RTC RTCP Parameters
 */
export interface RTCRtcpParameters {
  cname?: string
  reducedSize?: boolean
  mux?: boolean
}

/**
 * RTC RTP Codec Parameters
 */
export interface RTCRtpCodecParameters {
  payloadType: number
  mimeType: string
  clockRate: number
  channels?: number
  sdpFmtpLine?: string
}

/**
 * RTC DTLS Transport
 */
export interface RTCDtlsTransport {
  state: 'new' | 'connecting' | 'connected' | 'closed' | 'failed'
  iceTransport: RTCIceTransport
  onstatechange: (() => void) | null
  onerror: ((event: Event) => void) | null
}

/**
 * RTC Ice Transport
 */
export interface RTCIceTransport {
  state:
    | 'new'
    | 'checking'
    | 'connected'
    | 'completed'
    | 'failed'
    | 'disconnected'
    | 'closed'
  role: 'controlling' | 'controlled'
  onstatechange: (() => void) | null
  ongatheringstatechange: (() => void) | null
}

/**
 * RTC Data Channel
 */
export interface RTCDataChannel {
  label: string
  ordered: boolean
  maxPacketLifeTime: number | null
  maxRetransmits: number | null
  protocol: string
  negotiated: boolean
  id: number | null
  readyState: 'connecting' | 'open' | 'closing' | 'closed'
  bufferedAmount: number
  bufferedAmountLowThreshold: number
  onopen: (() => void) | null
  onerror: ((event: Event) => void) | null
  onclose: (() => void) | null
  onmessage: ((event: MessageEvent) => void) | null
  close(): void
  send(data: string | ArrayBuffer | ArrayBufferView | Blob): void
}

/**
 * RTCPeerConnection class
 */
export interface RTCPeerConnection extends RTCPeerConnectionEventHandlers {
  readonly localDescription: RTCSessionDescription | null
  readonly remoteDescription: RTCSessionDescription | null
  readonly signalingState:
    | 'stable'
    | 'have-local-offer'
    | 'have-remote-offer'
    | 'have-local-pranswer'
    | 'have-remote-pranswer'
    | 'closed'
  readonly iceGatheringState: 'new' | 'gathering' | 'complete'
  readonly iceConnectionState:
    | 'new'
    | 'checking'
    | 'connected'
    | 'completed'
    | 'failed'
    | 'disconnected'
    | 'closed'
  readonly connectionState:
    | 'new'
    | 'connecting'
    | 'connected'
    | 'disconnected'
    | 'failed'
    | 'closed'

  createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>
  createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>
  setLocalDescription(description: RTCSessionDescriptionInit): Promise<void>
  setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>
  addIceCandidate(candidate: RTCIceCandidateInit | RTCIceCandidate): Promise<void>
  getConfiguration(): RTCConfiguration
  getSenders(): RTCRtpSender[]
  getReceivers(): RTCRtpReceiver[]
  getTransceivers(): RTCRtpTransceiver[]
  addTrack(track: MediaStreamTrack, stream: MediaStream): RTCRtpSender
  removeTrack(sender: RTCRtpSender): void
  close(): void
}

/**
 * RTC Offer Options
 */
export interface RTCOfferOptions {
  offerToReceiveAudio?: boolean
  offerToReceiveVideo?: boolean
  voiceActivityDetection?: boolean
  iceRestart?: boolean
}

/**
 * RTC Answer Options
 */
export interface RTCAnswerOptions {
  voiceActivityDetection?: boolean
  offerToReceiveAudio?: boolean
  offerToReceiveVideo?: boolean
}

/**
 * Media Devices interface
 */
export interface MediaDevices {
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>
  getDisplayMedia(constraints: MediaStreamConstraints): Promise<MediaStream>
  enumerateDevices(): Promise<MediaDeviceInfo[]>
}

/**
 * Media Stream Constraints
 */
export interface MediaStreamConstraints {
  audio?: boolean | MediaTrackConstraints
  video?: boolean | MediaTrackConstraints
}

/**
 * Media Track Constraints
 */
export interface MediaTrackConstraints extends MediaTrackConstraintSet {
  advanced?: MediaTrackConstraintSet[]
}

/**
 * Media Track Constraint Set
 */
export interface MediaTrackConstraintSet {
  width?: number | ConstrainLongRange
  height?: number | ConstrainLongRange
  aspectRatio?: number | ConstrainDoubleRange
  frameRate?: number | ConstrainDoubleRange
  facingMode?: 'user' | 'environment' | 'left' | 'right'
  resizeMode?: 'none' | 'crop-and-scale'
  sampleRate?: number | ConstrainLongRange
  sampleSize?: number | ConstrainLongRange
  echoCancellation?: boolean | ConstrainBoolean
  autoGainControl?: boolean | ConstrainBoolean
  noiseSuppression?: boolean | ConstrainBoolean
  latency?: number | ConstrainDoubleRange
  channelCount?: number | ConstrainLongRange
  deviceId?: string | ConstrainDOMString
  groupId?: string | ConstrainDOMString
}

/**
 * Constrain Long Range
 */
export interface ConstrainLongRange {
  exact?: number
  ideal?: number
  min?: number
  max?: number
}

/**
 * Constrain Double Range
 */
export interface ConstrainDoubleRange {
  exact?: number
  ideal?: number
  min?: number
  max?: number
}

/**
 * Constrain Boolean
 */
export interface ConstrainBoolean {
  exact?: boolean
  ideal?: boolean
}

/**
 * Constrain DOM String
 */
export interface ConstrainDOMString {
  exact?: string | string[]
  ideal?: string | string[]
}

/**
 * Media Device Info
 */
export interface MediaDeviceInfo {
  deviceId: string
  kind: 'audioinput' | 'audiooutput' | 'videoinput'
  label: string
  groupId: string
}

declare module 'react-native-webrtc' {
  const RTCPeerConnection: new (configuration?: RTCConfiguration) => RTCPeerConnection
  const RTCSessionDescription: new (
    descriptionInitDict: RTCSessionDescriptionInit
  ) => RTCSessionDescription
  const RTCIceCandidate: new (candidateInitDict?: RTCIceCandidateInit) => RTCIceCandidate
  const mediaDevices: MediaDevices
  const MediaStream: new (
    stream?: MediaStream | MediaStreamTrack[] | { track?: MediaStreamTrack; stream?: MediaStream }
  ) => MediaStream
  const MediaStreamTrack: new (
    kind: 'audio' | 'video',
    id?: string,
    label?: string
  ) => MediaStreamTrack
  const RTCView: React.ComponentType<{
    streamURL?: string
    objectFit?: 'contain' | 'cover'
    mirror?: boolean
    zOrder?: number
    style?: unknown
  }>

  export {
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceCandidate,
    mediaDevices,
    MediaStream,
    MediaStreamTrack,
    RTCView,
  }

  export type {
    RTCConfiguration,
    RTCIceServer,
    RTCSessionDescriptionInit,
    RTCIceCandidateInit,
    MediaStreamConstraints,
    MediaTrackConstraints,
    RTCOfferOptions,
    RTCAnswerOptions,
  }
}
