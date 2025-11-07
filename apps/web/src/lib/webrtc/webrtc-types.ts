/**
 * WebRTC Type Definitions
 */

// Re-export browser WebRTC types for consistency
export type RTCPeerConnection = globalThis.RTCPeerConnection
export type RTCSessionDescription = globalThis.RTCSessionDescription
export type RTCSessionDescriptionInit = globalThis.RTCSessionDescriptionInit
export type RTCIceCandidate = globalThis.RTCIceCandidate
export type RTCIceCandidateInit = globalThis.RTCIceCandidateInit
export type RTCConfiguration = globalThis.RTCConfiguration
export type RTCIceServer = globalThis.RTCIceServer
export type RTCOfferOptions = globalThis.RTCOfferOptions
export type RTCAnswerOptions = globalThis.RTCAnswerOptions
export type RTCTrackEvent = globalThis.RTCTrackEvent
export type MediaStream = globalThis.MediaStream
export type MediaStreamTrack = globalThis.MediaStreamTrack
export type RTCStatsReport = globalThis.RTCStatsReport

export type RTCPeerConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed'

export type RTCIceConnectionState =
  | 'new'
  | 'checking'
  | 'connected'
  | 'completed'
  | 'failed'
  | 'disconnected'
  | 'closed'

export type RTCIceGatheringState =
  | 'new'
  | 'gathering'
  | 'complete'
