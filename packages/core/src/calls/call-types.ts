// packages/core/src/calls/call-types.ts

export type CallDirection = 'incoming' | 'outgoing'
export type CallKind = 'direct'
export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'in-call' | 'ended' | 'failed'

export type MediaState = 'enabled' | 'muted' | 'off'

export interface CallParticipant {
  id: string
  displayName: string
  avatarUrl?: string | null
  isLocal: boolean
  microphone: MediaState
  camera: MediaState
}

export interface CallSession {
  id: string
  kind: CallKind
  direction: CallDirection
  status: CallStatus
  localParticipant: CallParticipant
  remoteParticipant: CallParticipant
  startedAt?: string
  endedAt?: string
  failureReason?: string
}

export type CallSignalType =
  | 'call-offer'
  | 'call-answer'
  | 'call-candidate'
  | 'call-ring'
  | 'call-reject'
  | 'call-end'

export interface CallSignalBase {
  type: CallSignalType
  callId: string
  fromUserId: string
  toUserId: string
}

export interface CallOfferSignal extends CallSignalBase {
  type: 'call-offer'
  sdp: string
}

export interface CallAnswerSignal extends CallSignalBase {
  type: 'call-answer'
  sdp: string
}

export interface CallCandidateSignal extends CallSignalBase {
  type: 'call-candidate'
  candidate: RTCIceCandidateInit
}

export interface CallRingSignal extends CallSignalBase {
  type: 'call-ring'
}

export interface CallRejectSignal extends CallSignalBase {
  type: 'call-reject'
  reason?: string
}

export interface CallEndSignal extends CallSignalBase {
  type: 'call-end'
  reason?: string
}

export type CallSignal =
  | CallOfferSignal
  | CallAnswerSignal
  | CallCandidateSignal
  | CallRingSignal
  | CallRejectSignal
  | CallEndSignal

export interface SignalingConfig {
  url: string
  token?: string
  userId: string
}
