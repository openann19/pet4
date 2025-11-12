/**
 * Production-grade WebRTC hook for React Native Mobile
 *
 * Implements full WebRTC peer connection with:
 * - STUN/TURN server configuration
 * - Media stream management (audio/video)
 * - Mute/unmute functionality
 * - Camera toggle
 * - ICE candidate handling
 * - Connection state management
 * - Proper cleanup and resource management
 * - Error handling with structured logging
 * - Reconnection logic with exponential backoff
 *
 * Location: apps/mobile/src/hooks/call/useWebRTC.ts
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { createLogger } from '@/utils/logger'
import * as Haptics from 'expo-haptics'
import type {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaDevices,
  MediaStream,
  RTCSessionDescriptionInit,
  RTCIceCandidateInit,
  RTCConfiguration,
  RTCIceServer,
} from '@/types/webrtc'

const logger = createLogger('useWebRTC')

export interface CallState {
  isConnecting: boolean
  isConnected: boolean
  isMuted: boolean
  isCameraOn: boolean
  error: string | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
}

export interface UseWebRTCOptions {
  callId: string
  remoteUserId: string
  isCaller?: boolean
  stunServers?: Array<{ urls: string | string[] }>
  turnServers?: Array<{
    urls: string | string[]
    username?: string
    credential?: string
  }>
  onSignalingData?: (data: {
    type: 'offer' | 'answer' | 'candidate'
    sdp?: RTCSessionDescriptionInit
    candidate?: RTCIceCandidateInit
  }) => void
  onRemoteStream?: (stream: MediaStream) => void
  onConnectionStateChange?: (
    state: 'connecting' | 'connected' | 'disconnected' | 'failed'
  ) => void
}

// Dynamic imports for react-native-webrtc
// These are loaded at runtime, so we use function types that match the constructors
let RTCPeerConnectionConstructor:
  | ((configuration?: RTCConfiguration) => RTCPeerConnection)
  | undefined
let RTCSessionDescriptionConstructor:
  | ((descriptionInitDict: RTCSessionDescriptionInit) => RTCSessionDescription)
  | undefined
let RTCIceCandidateConstructor:
  | ((candidateInitDict?: RTCIceCandidateInit) => RTCIceCandidate)
  | undefined
let mediaDevicesInstance: MediaDevices | undefined

/**
 * Production-grade WebRTC hook for React Native
 */
export const useWebRTC = (options: UseWebRTCOptions) => {
  const {
    callId,
    remoteUserId,
    isCaller = false,
    stunServers,
    turnServers,
    onSignalingData,
    onRemoteStream,
    onConnectionStateChange,
  } = options

  const [callState, setCallState] = useState<CallState>({
    isConnecting: true,
    isConnected: false,
    isMuted: false,
    isCameraOn: true,
    error: null,
    localStream: null,
    remoteStream: null,
  })

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const isInitializedRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isWebRTCModuleLoaded, setIsWebRTCModuleLoaded] = useState(false)

  // Load WebRTC module dynamically
  useEffect(() => {
    if (!isWebRTCModuleLoaded) {
      void import('react-native-webrtc')
        .then((module: unknown) => {
          const webrtcModule = module as {
            RTCPeerConnection: new (configuration?: RTCConfiguration) => RTCPeerConnection
            RTCSessionDescription: new (
              descriptionInitDict: RTCSessionDescriptionInit
            ) => RTCSessionDescription
            RTCIceCandidate: new (candidateInitDict?: RTCIceCandidateInit) => RTCIceCandidate
            mediaDevices: MediaDevices
          }
          RTCPeerConnectionConstructor = (
            configuration?: RTCConfiguration
          ): RTCPeerConnection => new webrtcModule.RTCPeerConnection(configuration)
          RTCSessionDescriptionConstructor = (
            descriptionInitDict: RTCSessionDescriptionInit
          ): RTCSessionDescription =>
            new webrtcModule.RTCSessionDescription(descriptionInitDict)
          RTCIceCandidateConstructor = (
            candidateInitDict?: RTCIceCandidateInit
          ): RTCIceCandidate => new webrtcModule.RTCIceCandidate(candidateInitDict)
          mediaDevicesInstance = webrtcModule.mediaDevices
          setIsWebRTCModuleLoaded(true)
          logger.info('WebRTC modules loaded successfully')
        })
        .catch((error: unknown) => {
          const err = error instanceof Error ? error : new Error(String(error))
          logger.error('Failed to load react-native-webrtc', err)
          setCallState((prev) => ({
            ...prev,
            error: 'WebRTC not available. Please install react-native-webrtc.',
            isConnecting: false,
          }))
        })
    }
  }, [isWebRTCModuleLoaded])

  // Build ICE server configuration
  const buildIceServers = useCallback((): RTCIceServer[] => {
    const iceServers: RTCIceServer[] = []

    // Add STUN servers
    if (stunServers && stunServers.length > 0) {
      for (const server of stunServers) {
        iceServers.push({ urls: server.urls })
      }
    } else {
      // Default STUN servers
      iceServers.push(
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      )
    }

    // Add TURN servers
    if (turnServers && turnServers.length > 0) {
      for (const server of turnServers) {
        const turnServer: RTCIceServer = { urls: server.urls }
        if (server.username) {
          turnServer.username = server.username
        }
        if (server.credential) {
          turnServer.credential = server.credential
        }
        iceServers.push(turnServer)
      }
    }

    return iceServers
  }, [stunServers, turnServers])

  // Cleanup function
  const cleanup = useCallback(async (): Promise<void> => {
    try {
      // Stop local stream
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          track.stop()
        }
        localStreamRef.current = null
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      // Clear remote stream
      remoteStreamRef.current = null

      isInitializedRef.current = false
      reconnectAttemptsRef.current = 0

      logger.info('WebRTC cleanup completed', { callId })
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Error during cleanup', err, { callId })
    }
  }, [callId])

  // Initialize WebRTC connection
  useEffect(() => {
    if (!isWebRTCModuleLoaded || isInitializedRef.current) {
      return
    }

    let mounted = true

    async function initialize(): Promise<void> {
      try {
        if (!RTCPeerConnectionConstructor || !mediaDevicesInstance) {
          throw new Error('WebRTC modules not loaded')
        }

        isInitializedRef.current = true
        setCallState((prev) => ({ ...prev, isConnecting: true, error: null }))
        onConnectionStateChange?.('connecting')

        // Get user media (audio + video)
        const stream = await mediaDevicesInstance.getUserMedia({
          audio: true,
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })

        if (!mounted) {
          // Cleanup if component unmounted during initialization
          for (const track of stream.getTracks()) {
            track.stop()
          }
          return
        }

        localStreamRef.current = stream
        setCallState((prev) => ({ ...prev, localStream: stream }))

        // Create peer connection
        const iceServers = buildIceServers()
        const peerConnection = RTCPeerConnectionConstructor({
          iceServers,
          iceTransportPolicy: 'all',
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require',
        })

        peerConnectionRef.current = peerConnection

        // Add local stream tracks to peer connection
        for (const track of stream.getTracks()) {
          peerConnection.addTrack(track, stream)
        }

        // Handle ICE candidates
        peerConnection.onicecandidate = (event: { candidate: RTCIceCandidateInit | null }) => {
          if (event.candidate && onSignalingData) {
            onSignalingData({
              type: 'candidate',
              candidate: event.candidate,
            })
          }
        }

        // Handle remote stream
        peerConnection.ontrack = (event: { streams: MediaStream[] }) => {
          if (event?.streams && event.streams.length > 0) {
            const remoteStream = event.streams[0] ?? null
            if (remoteStream) {
              remoteStreamRef.current = remoteStream
              setCallState((prev) => ({ ...prev, remoteStream }))
              onRemoteStream?.(remoteStream)
              logger.info('Remote stream received', { callId, remoteUserId })
            }
          }
        }

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          if (!peerConnection) return

          const state = peerConnection.connectionState
          logger.debug('Connection state changed', { state, callId })

          if (state === 'connected') {
            setCallState((prev) => ({
              ...prev,
              isConnecting: false,
              isConnected: true,
              error: null,
            }))
            onConnectionStateChange?.('connected')
            reconnectAttemptsRef.current = 0
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          } else if (state === 'connecting') {
            setCallState((prev) => ({
              ...prev,
              isConnecting: true,
              isConnected: false,
            }))
            onConnectionStateChange?.('connecting')
          } else if (state === 'disconnected' || state === 'failed') {
            setCallState((prev) => ({
              ...prev,
              isConnecting: false,
              isConnected: false,
              error: `Connection ${state}`,
            }))
            onConnectionStateChange?.(state === 'failed' ? 'failed' : 'disconnected')

            // Attempt reconnection with exponential backoff
            if (state === 'failed' && reconnectAttemptsRef.current < 3) {
              const delay = Math.min(
                1000 * Math.pow(2, reconnectAttemptsRef.current),
                8000
              )
              reconnectAttemptsRef.current += 1
              reconnectTimeoutRef.current = setTimeout(() => {
                logger.info('Attempting reconnection', {
                  attempt: reconnectAttemptsRef.current,
                  callId,
                })
                initialize().catch((error: unknown) => {
                  const err = error instanceof Error ? error : new Error(String(error))
                  logger.error('Reconnection failed', err)
                })
              }, delay)
            }
          } else if (state === 'closed') {
            setCallState((prev) => ({
              ...prev,
              isConnecting: false,
              isConnected: false,
            }))
            onConnectionStateChange?.('disconnected')
          }
        }

        // Handle ICE connection state
        peerConnection.oniceconnectionstatechange = () => {
          if (!peerConnection) return

          const iceState = peerConnection.iceConnectionState
          logger.debug('ICE connection state changed', { iceState, callId })

          if (iceState === 'failed' || iceState === 'disconnected') {
            setCallState((prev) => ({
              ...prev,
              error: `ICE connection ${iceState}`,
              isConnected: false,
            }))
          }
        }

        // Create offer if caller
        if (isCaller) {
          const offer = await peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          })
          await peerConnection.setLocalDescription(offer)

          if (onSignalingData) {
            onSignalingData({
              type: 'offer',
              sdp: offer,
            })
          }
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('Failed to initialize WebRTC', err, { callId, remoteUserId })
        if (mounted) {
          setCallState((prev) => ({
            ...prev,
            error: err.message,
            isConnecting: false,
            isConnected: false,
          }))
          onConnectionStateChange?.('failed')
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      }
    }

    initialize()

    return () => {
      mounted = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      void cleanup()
    }
  }, [
    isWebRTCModuleLoaded,
    callId,
    remoteUserId,
    isCaller,
    buildIceServers,
    onSignalingData,
    onRemoteStream,
    onConnectionStateChange,
    cleanup,
  ])

  // Toggle mute/unmute
  const toggleMute = useCallback((): void => {
    try {
      if (!localStreamRef.current) {
        logger.warn('Cannot toggle mute: no local stream', { callId })
        return
      }

      const audioTracks = localStreamRef.current.getAudioTracks()
      if (audioTracks.length === 0) {
        logger.warn('Cannot toggle mute: no audio tracks', { callId })
        return
      }

      const newMutedState = !callState.isMuted

      // Enable/disable audio tracks (inverted: muted = disabled)
      for (const track of audioTracks) {
        track.enabled = !newMutedState
      }

      // Also update RTCRtpSender if peer connection exists
      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders()
        for (const sender of senders) {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = !newMutedState
          }
        }
      }

      setCallState((prev) => ({
        ...prev,
        isMuted: newMutedState,
      }))

      void Haptics.impactAsync(
        newMutedState
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      )

      logger.debug('Mute toggled', { muted: newMutedState, callId })
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to toggle mute', err, { callId })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }, [callState.isMuted, callId])

  // Toggle camera on/off
  const toggleCamera = useCallback((): void => {
    try {
      if (!localStreamRef.current) {
        logger.warn('Cannot toggle camera: no local stream', { callId })
        return
      }

      const videoTracks = localStreamRef.current.getVideoTracks()
      if (videoTracks.length === 0) {
        logger.warn('Cannot toggle camera: no video tracks', { callId })
        return
      }

      const newCameraState = !callState.isCameraOn

      // Enable/disable video tracks
      for (const track of videoTracks) {
        track.enabled = newCameraState
      }

      // Also update RTCRtpSender if peer connection exists
      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders()
        for (const sender of senders) {
          if (sender.track && sender.track.kind === 'video') {
            sender.track.enabled = newCameraState
          }
        }
      }

      setCallState((prev) => ({
        ...prev,
        isCameraOn: newCameraState,
      }))

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      logger.debug('Camera toggled', { cameraOn: newCameraState, callId })
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to toggle camera', err, { callId })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }, [callState.isCameraOn, callId])

  // End call
  const endCall = useCallback(async (): Promise<void> => {
    try {
      await cleanup()
      setCallState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }))
      onConnectionStateChange?.('disconnected')
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      logger.info('Call ended', { callId })
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Error ending call', err, { callId })
    }
  }, [cleanup, callId, onConnectionStateChange])

  // Handle incoming signaling data (offer/answer/candidate)
  const handleSignalingData = useCallback(
    async (data: {
      type: 'offer' | 'answer' | 'candidate'
      sdp?: RTCSessionDescriptionInit
      candidate?: RTCIceCandidateInit
    }): Promise<void> => {
      try {
        if (
          !peerConnectionRef.current ||
          !RTCSessionDescriptionConstructor ||
          !RTCIceCandidateConstructor
        ) {
          logger.warn('Cannot handle signaling: peer connection not initialized', { callId })
          return
        }

        if (data.type === 'offer' && data.sdp) {
          // Set remote description and create answer
          await peerConnectionRef.current.setRemoteDescription(data.sdp)

          const answer = await peerConnectionRef.current.createAnswer()
          await peerConnectionRef.current.setLocalDescription(answer)

          if (onSignalingData) {
            onSignalingData({
              type: 'answer',
              sdp: answer,
            })
          }
        } else if (data.type === 'answer' && data.sdp) {
          // Set remote description
          await peerConnectionRef.current.setRemoteDescription(data.sdp)
        } else if (data.type === 'candidate' && data.candidate) {
          // Add ICE candidate
          await peerConnectionRef.current.addIceCandidate(data.candidate)
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('Failed to handle signaling data', err, { callId, type: data.type })
        setCallState((prev) => ({
          ...prev,
          error: `Failed to handle ${data.type}`,
        }))
      }
    },
    [callId, onSignalingData]
  )

  return {
    callState,
    toggleMute,
    toggleCamera,
    endCall,
    handleSignalingData,
  }
}
