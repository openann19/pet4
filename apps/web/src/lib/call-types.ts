export type CallStatus =
  | 'idle'
  | 'initiating'
  | 'ringing'
  | 'connecting'
  | 'active'
  | 'ended'
  | 'missed'
  | 'declined'
  | 'failed';
export type CallType = 'voice' | 'video';
export type VideoQuality = '4k' | '1080p' | '720p' | '480p';
export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  petName?: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeaking?: boolean;
  joinedAt?: string;
}

export interface Call {
  id: string;
  roomId: string;
  type: CallType;
  initiatorId: string;
  recipientId: string;
  status: CallStatus;
  startTime?: string;
  endTime?: string;
  duration: number;
  quality: NetworkQuality;
  videoQuality?: VideoQuality;
  actualResolution?: string;
}

export interface CallSession {
  call: Call;
  localParticipant: CallParticipant;
  remoteParticipant: CallParticipant;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isMinimized: boolean;
  videoQuality: VideoQuality;
}

export interface GroupCall {
  id: string;
  roomId: string;
  type: CallType;
  initiatorId: string;
  status: CallStatus;
  startTime?: string;
  endTime?: string;
  duration: number;
  quality: NetworkQuality;
  videoQuality?: VideoQuality;
  actualResolution?: string;
  playdateId?: string;
  title?: string;
}

export interface GroupCallSession {
  call: GroupCall;
  participants: Map<string, CallParticipant>;
  localParticipant: CallParticipant;
  streams: Map<string, MediaStream>;
  localStream?: MediaStream;
  isMinimized: boolean;
  videoQuality: VideoQuality;
  layout: 'grid' | 'spotlight' | 'sidebar';
  spotlightParticipantId?: string;
}

export interface CallHistoryItem {
  id: string;
  roomId: string;
  matchedPetName: string;
  matchedPetPhoto: string;
  type: CallType;
  status: CallStatus;
  timestamp: string;
  duration: number;
  participantCount?: number;
}
