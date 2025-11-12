/**
 * Call Manager Hook
 *
 * Manages call state (idle, incoming, outgoing, active) and integrates signaling service with useWebRTC
 * Location: apps/mobile/src/hooks/call/useCallManager.ts
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { createLogger } from '@/utils/logger'
import { useWebRTC, type CallState } from '@/hooks/call/useWebRTC'
import { WebRTCSignalingService } from '@/services/webrtc-signaling'
import { getWebRTCConfig } from '@/config/webrtc-config'
import type {
  RTCSessionDescriptionInit,
  RTCIceCandidateInit,
} from '@/types/webrtc'

const logger = createLogger('useCallManager')

export type CallStatus = 'idle' | 'incoming' | 'outgoing' | 'connecting' | 'active' | 'ended'

export interface CallInfo {
  callId: string
  remoteUserId: string
  remoteName: string
  remotePhoto?: string
  isCaller: boolean
}

export interface UseCallManagerOptions {
  localUserId: string
  onCallStateChange?: (status: CallStatus) => void
  onError?: (error: Error) => void
}

export interface UseCallManagerReturn {
  // Call state
  callStatus: CallStatus
  currentCall: CallInfo | null
  callState: CallState | null

  // Call actions
  startCall: (remoteUserId: string, remoteName: string, remotePhoto?: string) => Promise<void>
  acceptCall: () => Promise<void>
  declineCall: () => Promise<void>
  endCall: () => Promise<void>

  // Call controls
  toggleMute: () => void
  toggleCamera: () => void

  // Incoming call info
  incomingCall: CallInfo | null

  // Helpers
  isInCall: boolean
  hasIncomingCall: boolean

  // Set incoming call (called from external source like RealtimeClient)
  setIncomingCall: (callInfo: CallInfo) => void
}

/**
 * Call Manager Hook
 * Manages call state and integrates signaling service with useWebRTC
 */
export function useCallManager(
  options: UseCallManagerOptions
): UseCallManagerReturn {
  const { localUserId, onCallStateChange, onError } = options

  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [currentCall, setCurrentCall] = useState<CallInfo | null>(null)
  const [incomingCall, setIncomingCall] = useState<CallInfo | null>(null)

  const signalingServiceRef = useRef<WebRTCSignalingService | null>(null)
  const signalingDataHandlerRef = useRef<((data: {
    type: 'offer' | 'answer' | 'candidate'
    sdp?: RTCSessionDescriptionInit
    candidate?: RTCIceCandidateInit
  }) => Promise<void>) | null>(null)
  const webrtcConfig = getWebRTCConfig()

  // Generate unique call ID
  const generateCallId = useCallback((): string => {
    return `call_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }, [])

  // Handle call status change
  const handleCallStatusChange = useCallback(
    (status: CallStatus) => {
      setCallStatus(status)
      onCallStateChange?.(status)
      logger.info('Call status changed', { status, callId: currentCall?.callId })
    },
    [onCallStateChange, currentCall?.callId]
  )

  // Create signaling data handler that sends via signaling service
  const handleSignalingDataOut = useCallback(
    (data: {
      type: 'offer' | 'answer' | 'candidate'
      sdp?: RTCSessionDescriptionInit
      candidate?: RTCIceCandidateInit
    }) => {
      // Send signaling data via signaling service
      if (signalingServiceRef.current) {
        if (data.type === 'offer' && data.sdp) {
          void signalingServiceRef.current.sendOffer(data.sdp)
        } else if (data.type === 'answer' && data.sdp) {
          void signalingServiceRef.current.sendAnswer(data.sdp)
        } else if (data.type === 'candidate' && data.candidate) {
          void signalingServiceRef.current.sendIceCandidate(data.candidate)
        }
      }
    },
    []
  )

  // Initialize WebRTC hook when call is active
  const {
    callState,
    toggleMute: webrtcToggleMute,
    toggleCamera: webrtcToggleCamera,
    endCall: webrtcEndCall,
    handleSignalingData: webrtcHandleSignalingData,
  } = useWebRTC(
    currentCall
      ? {
          callId: currentCall.callId,
          remoteUserId: currentCall.remoteUserId,
          isCaller: currentCall.isCaller,
          stunServers: webrtcConfig.stunServers,
          turnServers: webrtcConfig.turnServers,
          onSignalingData: handleSignalingDataOut,
          onRemoteStream: (_stream) => {
            logger.info('Remote stream received', {
              callId: currentCall.callId,
            })
            if (callStatus === 'outgoing' || callStatus === 'incoming') {
              handleCallStatusChange('active')
            }
          },
          onConnectionStateChange: (state) => {
            logger.info('Connection state changed', {
              callId: currentCall.callId,
              state,
            })
            if (state === 'connected') {
              handleCallStatusChange('active')
            } else if (state === 'disconnected' || state === 'failed') {
              handleCallStatusChange('ended')
            }
          },
        }
      : {
          callId: '',
          remoteUserId: '',
          isCaller: false,
        }
  )

  // Update signaling data handler ref when WebRTC hook is ready
  useEffect(() => {
    if (webrtcHandleSignalingData) {
      signalingDataHandlerRef.current = webrtcHandleSignalingData
    }
  }, [webrtcHandleSignalingData])

  // Cleanup signaling service
  const cleanupSignalingService = useCallback(() => {
    if (signalingServiceRef.current) {
      signalingServiceRef.current.cleanup()
      signalingServiceRef.current = null
    }
  }, [])

  // Start call
  const startCall = useCallback(
    async (
      remoteUserId: string,
      remoteName: string,
      remotePhoto?: string
    ): Promise<void> => {
      try {
        if (callStatus !== 'idle') {
          throw new Error('Cannot start call: Another call is in progress')
        }

        const callId = generateCallId()
        const callInfo: CallInfo = {
          callId,
          remoteUserId,
          remoteName,
          isCaller: true,
        }
        if (remotePhoto) {
          callInfo.remotePhoto = remotePhoto
        }

        // Set call state first (this will initialize WebRTC hook)
        setCurrentCall(callInfo)
        handleCallStatusChange('outgoing')

        // Initialize signaling service after a short delay to allow WebRTC hook to initialize
        // The signaling service will use the ref to access the handler
        setTimeout(() => {
          const signalingService = new WebRTCSignalingService({
            callId,
            localUserId,
            remoteUserId,
            onSignalingData: (data) => {
              // Handle incoming signaling data by passing to WebRTC hook via ref
              if (signalingDataHandlerRef.current) {
                void signalingDataHandlerRef.current(data)
              } else {
                logger.warn('Signaling data handler not ready', { callId })
              }
            },
            onError: (error) => {
              logger.error('Signaling error', error, { callId })
              onError?.(error)
            },
          })

          signalingService.initialize()
          signalingServiceRef.current = signalingService
        }, 100)

        logger.info('Call started', {
          callId,
          remoteUserId,
          remoteName,
        })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('Failed to start call', err, { remoteUserId })
        onError?.(err)
        throw err
      }
    },
    [
      callStatus,
      generateCallId,
      localUserId,
      handleCallStatusChange,
      onError,
    ]
  )

  // Accept call
  const acceptCall = useCallback(async (): Promise<void> => {
    try {
      if (!incomingCall) {
        throw new Error('No incoming call to accept')
      }

      if (callStatus !== 'incoming') {
        throw new Error('Cannot accept call: Call status is not incoming')
      }

      // Set call state first (this will initialize WebRTC hook)
      setCurrentCall(incomingCall)
      const callInfo = incomingCall
      setIncomingCall(null)
      handleCallStatusChange('active')

      // Initialize signaling service after a short delay to allow WebRTC hook to initialize
      setTimeout(() => {
        const signalingService = new WebRTCSignalingService({
          callId: callInfo.callId,
          localUserId,
          remoteUserId: callInfo.remoteUserId,
          onSignalingData: (data) => {
            // Handle incoming signaling data by passing to WebRTC hook via ref
            if (signalingDataHandlerRef.current) {
              void signalingDataHandlerRef.current(data)
            } else {
              logger.warn('Signaling data handler not ready', { callId: callInfo.callId })
            }
          },
          onError: (error) => {
            logger.error('Signaling error', error, { callId: callInfo.callId })
            onError?.(error)
          },
        })

        signalingService.initialize()
        signalingServiceRef.current = signalingService
      }, 100)

      logger.info('Call accepted', {
        callId: incomingCall.callId,
        remoteUserId: incomingCall.remoteUserId,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to accept call', err, { callId: incomingCall?.callId })
      onError?.(err)
      throw err
    }
  }, [
      incomingCall,
      callStatus,
      localUserId,
      handleCallStatusChange,
      onError,
    ])

  // Decline call
  const declineCall = useCallback(async (): Promise<void> => {
    try {
      if (!incomingCall) {
        throw new Error('No incoming call to decline')
      }

      // Send call end signal
      if (signalingServiceRef.current) {
        await signalingServiceRef.current.sendCallEnd()
      }

      // Cleanup
      cleanupSignalingService()
      setIncomingCall(null)
      handleCallStatusChange('idle')

      logger.info('Call declined', {
        callId: incomingCall.callId,
        remoteUserId: incomingCall.remoteUserId,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to decline call', err, { callId: incomingCall?.callId })
      onError?.(err)
    }
  }, [incomingCall, cleanupSignalingService, handleCallStatusChange, onError])

  // End call
  const endCall = useCallback(async (): Promise<void> => {
    try {
      if (!currentCall) {
        throw new Error('No active call to end')
      }

      // Send call end signal
      if (signalingServiceRef.current) {
        await signalingServiceRef.current.sendCallEnd()
      }

      // End WebRTC connection
      await webrtcEndCall()

      // Cleanup
      cleanupSignalingService()
      setCurrentCall(null)
      setIncomingCall(null)
      handleCallStatusChange('idle')

      logger.info('Call ended', {
        callId: currentCall.callId,
        remoteUserId: currentCall.remoteUserId,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to end call', err, { callId: currentCall?.callId })
      onError?.(err)
    }
  }, [
    currentCall,
    webrtcEndCall,
    cleanupSignalingService,
    handleCallStatusChange,
    onError,
  ])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (callStatus === 'active' && currentCall) {
      webrtcToggleMute()
    }
  }, [callStatus, currentCall, webrtcToggleMute])

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (callStatus === 'active' && currentCall) {
      webrtcToggleCamera()
    }
  }, [callStatus, currentCall, webrtcToggleCamera])

  // Set incoming call (called from external source like RealtimeClient)
  const setIncomingCallHandler = useCallback(
    (callInfo: CallInfo) => {
      if (callStatus !== 'idle') {
        logger.warn('Cannot set incoming call: Another call is in progress', {
          currentStatus: callStatus,
        })
        return
      }

      setIncomingCall(callInfo)
      handleCallStatusChange('incoming')

      logger.info('Incoming call set', {
        callId: callInfo.callId,
        remoteUserId: callInfo.remoteUserId,
      })
    },
    [callStatus, handleCallStatusChange, setIncomingCall]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSignalingService()
    }
  }, [cleanupSignalingService])

  return {
    callStatus,
    currentCall,
    callState: currentCall ? callState : null,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
    incomingCall,
    isInCall: callStatus === 'active' || callStatus === 'outgoing',
    hasIncomingCall: callStatus === 'incoming' && incomingCall !== null,
    setIncomingCall: setIncomingCallHandler,
  }
}
