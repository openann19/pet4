/**
 * MatchesScreen Component
 *
 * Matches screen with video calling integration
 * Location: apps/mobile/src/screens/MatchesScreen.tsx
 */
import { FeatureCard } from '@mobile/components/FeatureCard'
import { SectionHeader } from '@mobile/components/SectionHeader'
import {
  CallInterface,
  IncomingCallNotification,
} from '@mobile/components/call'
import type { CallInfo } from '@mobile/hooks/call/useCallManager'
import { useCallManager } from '@mobile/hooks/call/useCallManager'
import { useUserStore } from '@mobile/store/user-store'
import { colors } from '@mobile/theme/colors'
import { realtime } from '@mobile/lib/realtime'
import { createLogger } from '@mobile/utils/logger'
import React, { useState, useCallback, useEffect } from 'react'
import { StyleSheet, Text, View, Modal, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const logger = createLogger('MatchesScreen')

export function MatchesScreen(): React.ReactElement {
  const user = useUserStore((state) => state.user)
  const localUserId = user?.id ?? 'current-user'

  // For demo purposes, use a hardcoded remote user
  // In production, this would come from the selected match
  const [selectedMatchUserId] = useState<string>('match-user-id')
  const [selectedMatchUserName] = useState<string>('Match User')
  const [selectedMatchUserPhoto] = useState<string | undefined>()

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
            remoteName: selectedMatchUserName,
            isCaller: false,
          }
          if (selectedMatchUserPhoto) {
            callInfo.remotePhoto = selectedMatchUserPhoto
          }
          callManager.setIncomingCall(callInfo)
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [localUserId, selectedMatchUserName, selectedMatchUserPhoto, callManager])

  // Handle start call
  const handleStartCall = useCallback(async () => {
    try {
      await callManager.startCall(
        selectedMatchUserId,
        selectedMatchUserName,
        selectedMatchUserPhoto ?? undefined
      )
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to start call', err)
    }
  }, [callManager, selectedMatchUserId, selectedMatchUserName, selectedMatchUserPhoto])

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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <SectionHeader title="Matches" description="Signal-driven pairing results." />
        <FeatureCard title="Today">
          <Text style={styles.text}>Your latest matches will show here.</Text>
          {!callManager.isInCall && (
            <Pressable onPress={handleStartCall} style={styles.callButton}>
              <Text style={styles.callButtonText}>📹 Call Match</Text>
            </Pressable>
          )}
        </FeatureCard>
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
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 16 },
  text: { color: colors.textSecondary, marginBottom: 16 },
  callButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  callButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
})
