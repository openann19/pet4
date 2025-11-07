import { useState, useEffect, useRef } from 'react'
import { useStorage } from '@/hooks/useStorage'
import type { Call, CallType, CallSession, CallHistoryItem, VideoQuality } from '@/lib/call-types'
import { 
  createCall, 
  requestMediaPermissions, 
  stopMediaStream,
  establishCallConnection,
  closePeerConnection,
  getActualResolution
} from '@/lib/call-utils'
import type { WebRTCPeer } from '@/lib/webrtc-peer'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logger'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('useCall')

export function useCall(roomId: string, currentUserId: string, currentUserName: string, currentUserAvatar?: string) {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [callHistory, setCallHistory] = useStorage<CallHistoryItem[]>('call-history', [])
  const [preferredQuality = '4k', setPreferredQuality] = useStorage<VideoQuality>('video-quality-preference', '4k')
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<WebRTCPeer | null>(null)

  useEffect(() => {
    return () => {
      endCall()
    }
  }, [])

  const initiateCall = async (
    recipientId: string,
    recipientName: string,
    recipientAvatar: string | undefined,
    type: CallType
  ) => {
    try {
      const stream = await requestMediaPermissions(type, preferredQuality)
      if (!stream) {
        toast.error('Unable to access camera/microphone')
        return
      }

      localStreamRef.current = stream

      const call = createCall(roomId, currentUserId, recipientId, type)
      const actualResolution = type === 'video' ? getActualResolution(stream) : undefined

      const session: CallSession = {
        call: {
          ...call,
          videoQuality: preferredQuality,
          ...(actualResolution !== undefined && { actualResolution })
        },
        localParticipant: {
          id: currentUserId,
          name: currentUserName,
          ...(currentUserAvatar !== undefined && { avatar: currentUserAvatar }),
          isMuted: false,
          isVideoEnabled: type === 'video'
        },
        remoteParticipant: {
          id: recipientId,
          name: recipientName,
          ...(recipientAvatar !== undefined && { avatar: recipientAvatar }),
          isMuted: false,
          isVideoEnabled: type === 'video'
        },
        localStream: stream,
        isMinimized: false,
        videoQuality: preferredQuality
      }

      setActiveCall(session)

      if (isTruthy(actualResolution)) {
        toast.success(`Call starting with ${String(actualResolution ?? '')}`)
      }

      const peer = await establishCallConnection({
        callId: call.id,
        localUserId: currentUserId,
        remoteUserId: recipientId,
        isInitiator: true,
        localStream: stream,
        onRemoteStream: (remoteStream: MediaStream) => {
          remoteStreamRef.current = remoteStream
          setActiveCall(prev => {
            if (!prev) return null
            return {
              ...prev,
              remoteStream
            }
          })
          toast.success('Call connected!')
        },
        onStatusChange: (status) => {
          setActiveCall(prev => {
            if (!prev) return null
            return {
              ...prev,
              call: { ...prev.call, status }
            }
          })
        }
      })
      
      peerConnectionRef.current = peer
    } catch (error) {
      toast.error('Failed to start call')
      logger.error('Failed to start call', error instanceof Error ? error : new Error(String(error)))
    }
  }

  const answerCall = async () => {
    if (!incomingCall) return

    try {
      const stream = await requestMediaPermissions(incomingCall.type, preferredQuality)
      if (!stream) {
        toast.error('Unable to access camera/microphone')
        declineCall()
        return
      }

      localStreamRef.current = stream
      const actualResolution = incomingCall.type === 'video' ? getActualResolution(stream) : undefined

      const session: CallSession = {
        call: { 
          ...incomingCall, 
          status: 'connecting',
          videoQuality: preferredQuality,
          ...(actualResolution !== undefined && { actualResolution })
        },
        localParticipant: {
          id: currentUserId,
          name: currentUserName,
          ...(currentUserAvatar !== undefined && { avatar: currentUserAvatar }),
          isMuted: false,
          isVideoEnabled: incomingCall.type === 'video'
        },
        remoteParticipant: {
          id: incomingCall.initiatorId,
          name: 'Pet Owner',
          isMuted: false,
          isVideoEnabled: incomingCall.type === 'video'
        },
        localStream: stream,
        isMinimized: false,
        videoQuality: preferredQuality
      }

      setActiveCall(session)
      setIncomingCall(null)

      const peer = await establishCallConnection({
        callId: incomingCall.id,
        localUserId: currentUserId,
        remoteUserId: incomingCall.initiatorId,
        isInitiator: false,
        localStream: stream,
        onRemoteStream: (remoteStream: MediaStream) => {
          remoteStreamRef.current = remoteStream
          setActiveCall(prev => {
            if (!prev) return null
            return {
              ...prev,
              remoteStream
            }
          })
          toast.success('Call connected!')
        },
        onStatusChange: (status) => {
          setActiveCall(prev => {
            if (!prev) return null
            return {
              ...prev,
              call: { ...prev.call, status }
            }
          })
        }
      })

      peerConnectionRef.current = peer
    } catch (error) {
      toast.error('Failed to answer call')
      logger.error('Failed to answer call', error instanceof Error ? error : new Error(String(error)))
    }
  }

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
        duration: 0
      })
    }
    setIncomingCall(null)
    toast.info('Call declined')
  }

  const endCall = () => {
    if (isTruthy(activeCall)) {
      const duration = Math.floor((new Date().getTime() - new Date(activeCall.call.startTime || Date.now()).getTime()) / 1000)
      
      addToHistory({
        id: activeCall.call.id,
        roomId: activeCall.call.roomId,
        matchedPetName: activeCall.remoteParticipant.name,
        matchedPetPhoto: activeCall.remoteParticipant.avatar || '',
        type: activeCall.call.type,
        status: activeCall.call.status === 'active' ? 'ended' : 'missed',
        timestamp: new Date().toISOString(),
        duration
      })

      stopMediaStream(localStreamRef.current || undefined)
      stopMediaStream(remoteStreamRef.current || undefined)
      closePeerConnection(peerConnectionRef.current || undefined)
      localStreamRef.current = null
      remoteStreamRef.current = null
      peerConnectionRef.current = null
    }

    setActiveCall(null)
    toast.info('Call ended')
  }

  const toggleMute = () => {
    if (!activeCall || !localStreamRef.current) return

    const audioTrack = localStreamRef.current.getAudioTracks()[0]
    if (isTruthy(audioTrack)) {
      audioTrack.enabled = !audioTrack.enabled
      setActiveCall(prev => {
        if (!prev) return null
        return {
          ...prev,
          localParticipant: {
            ...prev.localParticipant,
            isMuted: !audioTrack.enabled
          }
        }
      })
    }
  }

  const toggleVideo = () => {
    if (!activeCall || !localStreamRef.current) return

    const videoTrack = localStreamRef.current.getVideoTracks()[0]
    if (isTruthy(videoTrack)) {
      videoTrack.enabled = !videoTrack.enabled
      setActiveCall(prev => {
        if (!prev) return null
        return {
          ...prev,
          localParticipant: {
            ...prev.localParticipant,
            isVideoEnabled: videoTrack.enabled
          }
        }
      })
    }
  }

  const addToHistory = (item: CallHistoryItem) => {
    setCallHistory(prev => [item, ...(prev || [])].slice(0, 50))
  }



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
    setPreferredQuality
  }
}
