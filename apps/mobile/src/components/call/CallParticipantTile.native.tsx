import React, { memo, useMemo } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import type { MediaStream } from '@/types/webrtc'
import { colors } from '@/theme/colors'
import { RTCView, type RTCViewProps } from 'react-native-webrtc'

const RTCViewImpl: React.ComponentType<RTCViewProps> = RTCView

export interface CallParticipantTileProps {
  readonly stream?: MediaStream | null
  readonly displayName: string
  readonly avatarUrl?: string | null | undefined
  readonly isLocal?: boolean
  readonly isMuted?: boolean
  readonly isCameraOff?: boolean
  readonly emphasis?: 'primary' | 'secondary'
}

const Badge = memo(({ label, style }: { label: string; style?: object }) => (
  <View style={[styles.badge, style]}>
    <Text style={styles.badgeText}>{label}</Text>
  </View>
))
Badge.displayName = 'Badge'

export function CallParticipantTile({
  stream,
  displayName,
  avatarUrl,
  isLocal = false,
  isMuted = false,
  isCameraOff = false,
  emphasis = 'primary',
}: CallParticipantTileProps): React.ReactElement {
  const streamURL = useMemo(
    () => (stream && typeof stream.toURL === 'function' ? stream.toURL() : ''),
    [stream]
  )
  const initials = useMemo(
    () =>
      displayName
        .trim()
        .split(' ')
        .map((segment) => segment[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || '😺',
    [displayName]
  )

  const containerStyles = Object.assign(
    {},
    styles.container,
    emphasis === 'primary' ? styles.primarySurface : styles.secondarySurface
  )

  const showVideo = Boolean(streamURL) && !isCameraOff

  return (
    <View style={containerStyles} accessibilityRole="image" accessibilityLabel={`${displayName} video`}>
      {showVideo ? (
        <RTCViewImpl streamURL={streamURL} style={Object.assign({}, styles.video, isLocal && styles.mirroredVideo)} />
      ) : (
        <View style={styles.placeholderSurface}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <View style={styles.initialsShell}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          {isCameraOff && (
            <Text style={styles.cameraOffLabel} accessibilityRole="text">
              Camera off
            </Text>
          )}
        </View>
      )}

      <View style={styles.namePlate}>
        <Text style={styles.nameText} numberOfLines={1}>
          {displayName}
        </Text>
      </View>

      {isLocal && <Badge label="You" style={styles.localBadge} />}
      {isMuted && <Badge label="Muted" style={styles.mutedBadge} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  primarySurface: {
    backgroundColor: '#050A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  secondarySurface: {
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  video: { flex: 1, backgroundColor: '#000' },
  mirroredVideo: { transform: [{ scaleX: -1 }] },
  placeholderSurface: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.surface,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  initialsShell: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avatarText: { color: colors.textPrimary, fontSize: 28, fontWeight: '700' },
  cameraOffLabel: { color: colors.textSecondary, fontSize: 12 },
  namePlate: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(5,5,5,0.4)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  nameText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  badge: {
    position: 'absolute',
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.75)',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  localBadge: {
    right: 12,
  },
  mutedBadge: {
    left: 12,
  },
})
