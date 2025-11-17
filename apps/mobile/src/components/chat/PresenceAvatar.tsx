/**
 * Presence Avatar with Aurora Ring — Mobile (React Native)
 *
 * Renders avatar with animated presence indicator
 *
 * Location: apps/mobile/src/components/chat/PresenceAvatar.tsx
 */

import React, { useMemo } from 'react'
import { View, Image, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'

// Optional gradient ring using Expo LinearGradient if available
type LinearGradientComponent = React.ComponentType<{
  colors: string[]
  start: { x: number; y: number }
  end: { x: number; y: number }
  style: unknown
}>

let LinearGradient: LinearGradientComponent | null = null
let linearGradientLoadPromise: Promise<LinearGradientComponent | null> | null = null

function loadLinearGradient(): Promise<LinearGradientComponent | null> {
  if (LinearGradient !== null) return Promise.resolve(LinearGradient)
  if (linearGradientLoadPromise) return linearGradientLoadPromise

  function isLinearGradientModule(
    module: unknown
  ): module is { LinearGradient: LinearGradientComponent } {
    return (
      typeof module === 'object' &&
      module !== null &&
      'LinearGradient' in module &&
      typeof (module as { LinearGradient?: unknown }).LinearGradient === 'function'
    )
  }

  linearGradientLoadPromise = import('expo-linear-gradient')
    .then(module => {
      const defaultExport = module.default ?? module
      if (isLinearGradientModule(defaultExport)) {
        LinearGradient = defaultExport.LinearGradient
      }
      return LinearGradient
    })
    .catch(() => {
      // LinearGradient not available
      return null
    })

  return linearGradientLoadPromise
}

// Initialize on module load (non-blocking)
loadLinearGradient().catch(() => {
  // Expected when expo-linear-gradient is not available
})

export interface PresenceAvatarProps {
  src?: string
  alt?: string
  fallback?: string
  status?: 'online' | 'away' | 'busy' | 'offline'
  size?: number
  className?: string // ignored on native; kept for parity
}

export function PresenceAvatar({
  src,
  alt,
  fallback,
  status = 'online',
  size = 40,
}: PresenceAvatarProps): React.ReactElement {
  const reduced = useReducedMotion()
  const rot = useSharedValue(0)
  const dur = getReducedMotionDuration(3600, reduced)

  useMemo(() => {
    rot.value = 0
    if (!reduced && status !== 'offline') {
      rot.value = withRepeat(withTiming(360, { duration: dur }), -1, false)
    }
  }, [reduced, status, dur, rot])

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${String(rot.value ?? '')}deg` }],
    opacity: status === 'offline' ? 0 : 1,
  }))

  const ringColors =
    status === 'online'
      ? ['#34d399', '#22d3ee', '#60a5fa']
      : status === 'away'
        ? ['#f59e0b', '#fb7185', '#f97316']
        : ['var(--color-error-9)', '#a855f7', '#6366f1']

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      {LinearGradient ? (
        <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
          <LinearGradient
            colors={ringColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.ring, { borderRadius: size / 2 + 6 }]}
          />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.ringFallback, { borderRadius: size / 2 + 6 }, ringStyle]} />
      )}

      <View style={[styles.avatarWrap, { width: size, height: size, borderRadius: size / 2 }]}>
        {src ? (
          <Image
            source={{ uri: src }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            accessibilityLabel={alt || fallback || 'Avatar'}
          />
        ) : (
          <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={styles.fallbackText}>{(fallback?.[0] ?? '?').toUpperCase()}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { justifyContent: 'center', alignItems: 'center' },
  ring: { position: 'absolute', top: -6, bottom: -6, left: -6, right: -6, opacity: 0.85 },
  ringFallback: {
    position: 'absolute',
    top: -3,
    bottom: -3,
    left: -3,
    right: -3,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarWrap: { overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#334155' },
  fallbackText: { color: 'var(--color-bg-overlay)', fontWeight: '700' },
})
