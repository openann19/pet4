import React from 'react'
import { View, StyleSheet } from 'react-native'
import type { MediaStream } from '@/types/webrtc'
import type { CallSession } from '@petspark/core'
import { CallParticipantTile } from './CallParticipantTile.native'

export interface CallParticipantsGridProps {
  readonly session: CallSession
  readonly localStream?: MediaStream | null
  readonly remoteStream?: MediaStream | null
}

export function CallParticipantsGrid({ session, localStream, remoteStream }: CallParticipantsGridProps): React.ReactElement {
  const remote = session.remoteParticipant
  const local = session.localParticipant
  if (!remote) return null;
  return (
    <View style={styles.container}>
      <View style={styles.remote}>
        <CallParticipantTile
          stream={remoteStream ?? null}
          displayName={remote.displayName}
          avatarUrl={remote.avatarUrl}
          isMuted={remote.microphone === 'muted'}
          isCameraOff={remote.camera === 'off'}
          emphasis="primary"
        />
      </View>
      <View style={styles.localPip}>
        <CallParticipantTile
          stream={localStream ?? null}
          displayName={local.displayName}
          avatarUrl={local.avatarUrl}
          isLocal
          isMuted={local.microphone === 'muted'}
          isCameraOff={local.camera === 'off'}
          emphasis="secondary"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  remote: { flex: 1 },
  localPip: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    width: 160,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
})
