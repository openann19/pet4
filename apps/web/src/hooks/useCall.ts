import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useStorage } from '@/hooks/use-storage';
import type { Call, CallType, CallSession, CallHistoryItem, VideoQuality } from '@/lib/call-types';
import {
  createCall,
  requestMediaPermissions,
  stopMediaStream,
  establishCallConnection,
  closePeerConnection,
  getActualResolution,
} from '@/lib/call-utils';
import { isTruthy } from '@petspark/shared';
import type { WebRTCPeer } from '@/lib/webrtc-peer';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useCall');

export function useCall(
  roomId: string,
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar?: string
): {
  activeCall: CallSession | null;
  incomingCall: Call | null;
  callHistory: CallHistoryItem[];
  initiateCall: (
    recipientId: string,
    recipientName: string,
    recipientAvatar: string | undefined,
    type: CallType
  ) => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  setIncomingCall: React.Dispatch<React.SetStateAction<Call | null>>;
  preferredQuality: VideoQuality;
  setPreferredQuality: (
    value: VideoQuality | ((prev: VideoQuality) => VideoQuality)
  ) => Promise<void>;
} {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [callHistory, setCallHistory] = useStorage<CallHistoryItem[]>('call-history', []);
  const [preferredQuality = '4k', setPreferredQuality] = useStorage<VideoQuality>(
    'video-quality-preference',
    '4k'
  );
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<WebRTCPeer | null>(null);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  const initiateCall = async (
    recipientId: string,
    recipientName: string,
    recipientAvatar: string | undefined,
    type: CallType
  ) => {
    try {
      const stream = await requestMediaPermissions(type, preferredQuality);
      if (!stream) {
        toast.error('Unable to access camera/microphone');
        return;
      }

      localStreamRef.current = stream;

      const call = createCall(roomId, currentUserId, recipientId, type);
      const actualResolution = type === 'video' ? getActualResolution(stream) : undefined;

      const session: CallSession = {
        call: {
          ...call,
          videoQuality: preferredQuality,
          ...(actualResolution !== undefined && { actualResolution }),
        },
        localParticipant: {
          id: currentUserId,
          name: currentUserName,
          ...(currentUserAvatar !== undefined && { avatar: currentUserAvatar }),
          isMuted: false,
          isVideoEnabled: type === 'video',
        },
        remoteParticipant: {
          id: recipientId,
          name: recipientName,
          ...(recipientAvatar !== undefined && { avatar: recipientAvatar }),
          isMuted: false,
          isVideoEnabled: type === 'video',
        },
        localStream: stream,
        isMinimized: false,
        videoQuality: preferredQuality,
      };

      setActiveCall(session);

      if (actualResolution) {
        toast.success(`Call starting with ${actualResolution}`);
      }

      const peer = await establishCallConnection({
        callId: call.id,
        localUserId: currentUserId,
        remoteUserId: recipientId,
        isInitiator: true,
        localStream: stream,
        onRemoteStream: (remoteStream: MediaStream) => {
          remoteStreamRef.current = remoteStream;
          setActiveCall((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              remoteStream,
            };
          });
          toast.success('Call connected!');
        },
        onStatusChange: (status) => {
          setActiveCall((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              call: { ...prev.call, status },
            };
          });
        },
      });

      peerConnectionRef.current = peer;
    } catch (_error) {
      toast.error('Failed to start call');
      logger.error(
        'Failed to start call',
        _error instanceof Error ? _error : new Error(String(_error))
      );
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      const stream = await requestMediaPermissions(incomingCall.type, preferredQuality);
      if (!stream) {
        toast.error('Unable to access camera/microphone');
        declineCall();
        return;
      }

      localStreamRef.current = stream;
      const actualResolution =
        incomingCall.type === 'video' ? getActualResolution(stream) : undefined;

      const session: CallSession = {
        call: {
          ...incomingCall,
          status: 'connecting',
          videoQuality: preferredQuality,
          ...(actualResolution !== undefined && { actualResolution }),
        },
        localParticipant: {
          id: currentUserId,
          name: currentUserName,
          ...(currentUserAvatar !== undefined && { avatar: currentUserAvatar }),
          isMuted: false,
          isVideoEnabled: incomingCall.type === 'video',
        },
        remoteParticipant: {
          id: incomingCall.initiatorId,
          name: 'Pet Owner',
          isMuted: false,
          isVideoEnabled: incomingCall.type === 'video',
        },
        localStream: stream,
        isMinimized: false,
        videoQuality: preferredQuality,
      };

      setActiveCall(session);
      setIncomingCall(null);

      const peer = await establishCallConnection({
        callId: incomingCall.id,
        localUserId: currentUserId,
        remoteUserId: incomingCall.initiatorId,
        isInitiator: false,
        localStream: stream,
        onRemoteStream: (remoteStream: MediaStream) => {
          remoteStreamRef.current = remoteStream;
          setActiveCall((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              remoteStream,
            };
          });
          toast.success('Call connected!');
        },
        onStatusChange: (status) => {
          setActiveCall((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              call: { ...prev.call, status },
            };
          });
        },
      });

      peerConnectionRef.current = peer;
    } catch (_error) {
      toast.error('Failed to answer call');
      logger.error(
        'Failed to answer call',
        _error instanceof Error ? _error : new Error(String(_error))
      );
    }
  };

  const declineCall = () => {
    if (isTruthy(incomingCall)) {
      addToHistory({
        id: incomingCall.id,
        roomId: incomingCall.roomId,
        matchedPetName: 'Unknown',
        matchedPetPhoto: '',
        type: incomingCall.type,
        status: 'declined',
        timestamp: new Date().toISOString(),
        duration: 0,
      });
    }
    setIncomingCall(null);
    toast.info('Call declined');
  };

  const endCall = () => {
    if (activeCall) {
      const duration = Math.floor(
        (new Date().getTime() - new Date(activeCall.call.startTime ?? Date.now()).getTime()) / 1000
      );

      addToHistory({
        id: activeCall.call.id,
        roomId: activeCall.call.roomId,
        matchedPetName: activeCall.remoteParticipant.name,
        matchedPetPhoto: activeCall.remoteParticipant.avatar ?? '',
        type: activeCall.call.type,
        status: activeCall.call.status === 'active' ? 'ended' : 'missed',
        timestamp: new Date().toISOString(),
        duration,
      });

      stopMediaStream(localStreamRef.current ?? undefined);
      stopMediaStream(remoteStreamRef.current ?? undefined);
      closePeerConnection(peerConnectionRef.current ?? undefined);
      localStreamRef.current = null;
      remoteStreamRef.current = null;
      peerConnectionRef.current = null;
    }

    setActiveCall(null);
    toast.info('Call ended');
  };

  const toggleMute = () => {
    if (!activeCall || !localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setActiveCall((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          localParticipant: {
            ...prev.localParticipant,
            isMuted: !audioTrack.enabled,
          },
        };
      });
    }
  };

  const toggleVideo = () => {
    if (!activeCall || !localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setActiveCall((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          localParticipant: {
            ...prev.localParticipant,
            isVideoEnabled: videoTrack.enabled,
          },
        };
      });
    }
  };

  const addToHistory = (item: CallHistoryItem) => {
    setCallHistory((prev) => [item, ...(prev ?? [])].slice(0, 50));
  };

  return {
    activeCall,
    incomingCall,
    callHistory,
    initiateCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    setIncomingCall,
    preferredQuality,
    setPreferredQuality,
  };
}
