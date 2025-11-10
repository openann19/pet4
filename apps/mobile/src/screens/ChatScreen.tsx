/**
 * ChatScreen Component
 *
 * Premium chat screen integrating ultra-premium chat effects:
 * - ChatList with Layout Animations
 * - Message bubbles with send/receive effects
 * - Status ticks, reactions, typing indicators
 * - Scroll FAB with magnetic effect
 * - Video calling integration
 *
 * Location: apps/mobile/src/screens/ChatScreen.tsx
 */
import { ChatList, type Message } from '@mobile/components/chat'
import {
  CallInterface,
  IncomingCallNotification,
} from '@mobile/components/call'
import type { CallInfo } from '@mobile/hooks/call/useCallManager'
import HoloBackgroundNative from '@mobile/components/chrome/HoloBackground'
import { useCallManager } from '@mobile/hooks/call/useCallManager'
import { useUserStore } from '@mobile/store/user-store'
import { colors } from '@mobile/theme/colors'
import React, { useState, useCallback, useEffect } from 'react'
import { StyleSheet, View, Modal, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { realtime } from '@mobile/lib/realtime'
import { createLogger } from '@mobile/utils/logger'

const logger = createLogger('ChatScreen')

export function ChatScreen(): React.ReactElement {
  const [messages] = useState<Message[]>([])
  const user = useUserStore((state) => state.user)
  const localUserId = user?.id ?? 'current-user'

  // For demo purposes, use a hardcoded remote user
  // In production, this would come from the chat/room context
  const [remoteUserId] = useState<string>('remote-user-id')
  const [remoteUserName] = useState<string>('Remote User')
  const [remoteUserPhoto] = useState<string | undefined>()

  // Initialize call manager
  const callManager = useCallManager({
    localUserId,
    onCallStateChange: (status) => {
      logger.info('Call status changed', { status })
    },
    onError: (error) => {
      logger.error('Call error', error)
    },
  })

  // Listen for incoming calls
  useEffect(() => {
    // Listen for incoming call signals from RealtimeClient
    const unsubscribe = realtime.onWebRTCSignal(
      'incoming-call',
      localUserId,
      (signal) => {
        if (signal.type === 'offer' && signal.from) {
          // Handle incoming call
          logger.info('Incoming call received', {
            from: signal.from,
            callId: signal.callId,
          })

          // Set incoming call in call manager
          // In production, this would fetch user info from API
          const callInfo: CallInfo = {
            callId: signal.callId,
            remoteUserId: signal.from,
            remoteName: remoteUserName,
            isCaller: false,
          }
          if (remoteUserPhoto) {
            callInfo.remotePhoto = remoteUserPhoto
          }
          callManager.setIncomingCall(callInfo)
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [localUserId, remoteUserName, remoteUserPhoto, callManager])

  // Handle start call
  const handleStartCall = useCallback(async () => {
    try {
      await callManager.startCall(
        remoteUserId,
        remoteUserName,
        remoteUserPhoto ?? undefined
      )
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to start call', err)
    }
  }, [callManager, remoteUserId, remoteUserName, remoteUserPhoto])

  // Handle end call
  const handleEndCall = useCallback(async () => {
    try {
      await callManager.endCall()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to end call', err)
    }
  }, [callManager])

  // Handle accept call
  const handleAcceptCall = useCallback(async () => {
    try {
      await callManager.acceptCall()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to accept call', err)
    }
  }, [callManager])

  // Handle decline call
  const handleDeclineCall = useCallback(async () => {
    try {
      await callManager.declineCall()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to decline call', err)
    }
  }, [callManager])

  return (
    <SafeAreaView style={styles.container}>
      <HoloBackgroundNative intensity={0.6} />
      <View style={styles.chatContainer}>
        {/* Chat Header with Call Button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat</Text>
          {!callManager.isInCall && (
            <Pressable onPress={handleStartCall} style={styles.callButton}>
              <Text style={styles.callButtonText}>📹 Call</Text>
            </Pressable>
          )}
        </View>

        <ChatList messages={messages} currentUserId={localUserId} />
      </View>

      {/* Call Interface Modal */}
      {callManager.currentCall &&
        callManager.callState &&
        (callManager.callStatus === 'active' || callManager.callStatus === 'outgoing') && (
          <Modal visible={true} transparent animationType="fade" statusBarTranslucent>
            <CallInterface
              callId={callManager.currentCall.callId}
              remoteUserId={callManager.currentCall.remoteUserId}
              remoteName={callManager.currentCall.remoteName}
              {...(callManager.currentCall.remotePhoto && {
                remotePhoto: callManager.currentCall.remotePhoto,
              })}
              onEndCall={handleEndCall}
              isCaller={callManager.currentCall.isCaller}
            />
          </Modal>
        )}

      {/* Incoming Call Notification */}
      {callManager.hasIncomingCall && callManager.incomingCall && (
        <IncomingCallNotification
          visible={callManager.callStatus === 'incoming'}
          caller={{
            id: callManager.incomingCall.remoteUserId,
            name: callManager.incomingCall.remoteName,
            ...(callManager.incomingCall.remotePhoto && {
              photo: callManager.incomingCall.remotePhoto,
            }),
          }}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  callButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  callButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
})
