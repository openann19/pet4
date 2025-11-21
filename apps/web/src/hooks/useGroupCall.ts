import { useState, useEffect, useRef } from 'react';
import { useStorage } from '@/hooks/use-storage';
import type {
  CallType,
  CallParticipant,
  GroupCallSession,
  CallHistoryItem,
  VideoQuality,
} from '@/lib/call-types';
import { isTruthy } from '@petspark/shared';
import {
  requestMediaPermissions,
  stopMediaStream,
  getActualResolution,
  createGroupCall,
} from '@/lib/call-utils';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useGroupCall');

export function useGroupCall(
  roomId: string,
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar?: string,
  currentPetName?: string
) {
  const [activeGroupCall, setActiveGroupCall] = useState<GroupCallSession | null>(null);
  const [callHistory, setCallHistory] = useStorage<CallHistoryItem[]>('call-history', []);
  const [preferredQuality = '1080p', setPreferredQuality] = useStorage<VideoQuality>(
    'video-quality-preference',
    '1080p'
  );
  const localStreamRef = useRef<MediaStream | null>(null);
  const participantStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  useEffect(() => {
    return () => {
      endGroupCall();
    };
  }, []);

  const initiateGroupCall = async (
    type: CallType,
    playdateId?: string,
    title?: string,
    initialParticipants: {
      id: string;
      name: string;
      avatar?: string;
      petName?: string;
    }[] = []
  ) => {
    try {
      const stream = await requestMediaPermissions(type, preferredQuality);
      if (!stream) {
        toast.error('Unable to access camera/microphone');
        return;
      }

      localStreamRef.current = stream;

      const call = createGroupCall(roomId, currentUserId, type, playdateId, title);
      const actualResolution = type === 'video' ? getActualResolution(stream) : undefined;

      const participants = new Map<string, CallParticipant>();
      const streams = new Map<string, MediaStream>();

      // Note: Group calls require SFU (Selective Forwarding Unit) or mesh architecture
      // For production, implement using WebRTC SFU service or mesh peer connections
      // Each participant would need individual peer connections or routing through SFU
      initialParticipants.forEach((participant) => {
        const callParticipant: CallParticipant = {
          id: participant.id,
          name: participant.name,
          ...(participant.avatar !== undefined && { avatar: participant.avatar }),
          ...(participant.petName !== undefined && { petName: participant.petName }),
          isMuted: false,
          isVideoEnabled: type === 'video',
          isSpeaking: false,
          joinedAt: new Date().toISOString(),
        };
        participants.set(participant.id, callParticipant);
        // Streams will be added when peer connections are established
        // This requires SFU architecture for production use
      });

      const session: GroupCallSession = {
        call: {
          ...call,
          videoQuality: preferredQuality,
        },
        localParticipant: {
          id: currentUserId,
          name: currentUserName,
          ...(currentUserAvatar !== undefined && { avatar: currentUserAvatar }),
          ...(currentPetName !== undefined && { petName: currentPetName }),
          isMuted: false,
          isVideoEnabled: type === 'video',
          isSpeaking: false,
          joinedAt: new Date().toISOString(),
        },
        participants,
        streams,
        localStream: stream,
        isMinimized: false,
        videoQuality: preferredQuality,
        layout: 'grid',
      };

      setActiveGroupCall(session);

      if (actualResolution) {
        toast.success(`Group call starting with ${actualResolution}`);
      }

      setTimeout(() => {
        setActiveGroupCall((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            call: { ...prev.call, status: 'active', startTime: new Date().toISOString() },
          };
        });
        toast.success('Group call connected!');
      }, 2000);
    } catch (error) {
      toast.error('Failed to start group call');
      logger.error(
        'Failed to start group call',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  const addParticipant = (participant: {
    id: string;
    name: string;
    avatar?: string;
    petName?: string;
  }) => {
    if (!activeGroupCall) return;

    const callParticipant: CallParticipant = {
      id: participant.id,
      name: participant.name,
      ...(participant.avatar !== undefined && { avatar: participant.avatar }),
      ...(participant.petName !== undefined && { petName: participant.petName }),
      isMuted: false,
      isVideoEnabled: activeGroupCall.call.type === 'video',
      isSpeaking: false,
      joinedAt: new Date().toISOString(),
    };

    // For production: Establish peer connection or SFU connection for this participant
    // Stream will be added when connection is established
    // This requires SFU architecture for group calls

    setActiveGroupCall((prev) => {
      if (!prev) return null;

      const newParticipants = new Map(prev.participants);
      newParticipants.set(participant.id, callParticipant);

      const newStreams = new Map(prev.streams);
      // Stream will be added when peer connection is established

      return {
        ...prev,
        participants: newParticipants,
        streams: newStreams,
      };
    });

    toast.success(`${participant.name} joined the call`);
  };

  const removeParticipant = (participantId: string) => {
    if (!activeGroupCall) return;

    const participant = activeGroupCall.participants.get(participantId);
    if (!participant) return;

    const stream = participantStreamsRef.current.get(participantId);
    if (stream) {
      stopMediaStream(stream);
      participantStreamsRef.current.delete(participantId);
    }

    setActiveGroupCall((prev) => {
      if (!prev) return null;

      const newParticipants = new Map(prev.participants);
      newParticipants.delete(participantId);

      const newStreams = new Map(prev.streams);
      newStreams.delete(participantId);

      return {
        ...prev,
        participants: newParticipants,
        streams: newStreams,
      };
    });

    toast.info(`${participant.name} left the call`);
  };

  const endGroupCall = () => {
    if (isTruthy(activeGroupCall)) {
      const duration = activeGroupCall.call.startTime
        ? Math.floor(
            (new Date().getTime() - new Date(activeGroupCall.call.startTime).getTime()) / 1000
          )
        : 0;

      const participantCount = activeGroupCall.participants.size + 1;

      addToHistory({
        id: activeGroupCall.call.id,
        roomId: activeGroupCall.call.roomId,
        matchedPetName: activeGroupCall.call.title ?? 'Group Call',
        matchedPetPhoto: '',
        type: activeGroupCall.call.type,
        status: activeGroupCall.call.status === 'active' ? 'ended' : 'missed',
        timestamp: new Date().toISOString(),
        duration,
        participantCount,
      });

      stopMediaStream(localStreamRef.current ?? undefined);
      localStreamRef.current = null;

      participantStreamsRef.current.forEach((stream) => {
        stopMediaStream(stream);
      });
      participantStreamsRef.current.clear();
    }

    setActiveGroupCall(null);
    toast.info('Group call ended');
  };

  const toggleMute = () => {
    if (!activeGroupCall || !localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setActiveGroupCall((prev) => {
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
    if (!activeGroupCall || !localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setActiveGroupCall((prev) => {
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

  const toggleLayout = () => {
    setActiveGroupCall((prev) => {
      if (!prev) return null;
      const layouts: ('grid' | 'spotlight' | 'sidebar')[] = ['grid', 'spotlight', 'sidebar'];
      const currentIndex = layouts.indexOf(prev.layout);
      const nextIndex = (currentIndex + 1) % layouts.length;
      const nextLayout = layouts[nextIndex];
      if (!nextLayout) return prev;
      return {
        ...prev,
        layout: nextLayout,
      };
    });
  };

  const setSpotlightParticipant = (participantId: string | undefined) => {
    setActiveGroupCall((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        layout: 'spotlight',
        ...(participantId !== undefined && { spotlightParticipantId: participantId }),
      };
    });
  };

  const addToHistory = (item: CallHistoryItem) => {
    void setCallHistory((prev) => [item, ...(prev ?? [])].slice(0, 50));
  };

  return {
    activeGroupCall,
    callHistory,
    initiateGroupCall,
    addParticipant,
    removeParticipant,
    endGroupCall,
    toggleMute,
    toggleVideo,
    toggleLayout,
    setSpotlightParticipant,
    preferredQuality,
    setPreferredQuality,
  };
}
