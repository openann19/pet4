import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CallSession } from '@petspark/core'
import type { MediaStream } from '@/types/webrtc'
import { CallParticipantsGrid } from './CallParticipantsGrid.native'

export interface CallOverlayProps {
  readonly visible: boolean
  readonly session: CallSession | null
  readonly localStream: MediaStream | null
  readonly remoteStream: MediaStream | null
  readonly onEnd: () => Promise<void>
  readonly onToggleMute: () => void
  readonly onToggleCamera: () => void
  readonly status: 'idle' | 'incoming' | 'outgoing' | 'connecting' | 'active' | 'ended'
}

export function CallOverlay(props: CallOverlayProps): React.ReactElement | null {
  const { visible, session, localStream, remoteStream, onEnd, onToggleMute, onToggleCamera, status } = props
  if (!visible || !session) return null

  const remote = session.remoteParticipant
  const local = session.localParticipant
  const remoteName = remote?.displayName ?? 'Remote'
  const statusCopy = statusLabel(status)
  const isMuted = local.microphone === 'muted'
  const isCameraOff = local.camera === 'off'

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.surface}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.statusLabel}>{statusCopy}</Text>
              <Text style={styles.remoteName} accessibilityRole="header" numberOfLines={1}>
                {remoteName}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                void onEnd()
              }}
              style={styles.minimizeButton}
              accessibilityRole="button"
              accessibilityLabel="End call"
            >
              <Text style={styles.minimizeText}>End</Text>
            </Pressable>
          </View>

          <View style={styles.gridWrapper}>
            <CallParticipantsGrid session={session} localStream={localStream} remoteStream={remoteStream} />
          </View>

          <View style={styles.controlsBar}>
            <ControlButton
              label={isMuted ? 'Unmute' : 'Mute'}
              variant={isMuted ? 'danger' : 'default'}
              onPress={onToggleMute}
              accessibilityLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            />
            <ControlButton
              label={isCameraOff ? 'Camera On' : 'Camera Off'}
              onPress={onToggleCamera}
              accessibilityLabel={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            />
            <ControlButton
              label="Hang Up"
              variant="danger"
              onPress={() => {
                void onEnd()
              }}
              accessibilityLabel="End call"
            />
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  )
}

function statusLabel(status: CallOverlayProps['status']): string {
  switch (status) {
    case 'connecting':
      return 'Connecting…'
    case 'outgoing':
      return 'Ringing…'
    case 'active':
      return 'In call'
    case 'incoming':
      return 'Incoming call'
    default:
      return ''
  }
}

const ControlButton = ({
  label,
  onPress,
  accessibilityLabel,
  variant = 'default',
}: {
  label: string
  onPress: () => void
  accessibilityLabel: string
  variant?: 'default' | 'danger'
}): React.ReactElement => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.controlButton, variant === 'danger' && styles.dangerButton]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.controlText, variant === 'danger' && styles.dangerText]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  safe: { ...StyleSheet.absoluteFillObject },
  surface: {
    flex: 1,
    marginHorizontal: 12,
    marginVertical: 16,
    borderRadius: 32,
    backgroundColor: '#010818',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  topBar: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    color: '#34d399',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  remoteName: { color: '#fff', fontSize: 20, fontWeight: '700', maxWidth: 220 },
  minimizeButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: 'rgba(15,23,42,0.9)',
  },
  minimizeText: { color: '#fff', fontWeight: '600' },
  gridWrapper: { flex: 1, paddingHorizontal: 16, paddingBottom: 100 },
  controlsBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  controlButton: {
    backgroundColor: 'rgba(15,23,42,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  controlText: { color: '#fff', fontWeight: '600' },
  dangerButton: { backgroundColor: '#B91C1C' },
  dangerText: { color: '#fff' },
})
