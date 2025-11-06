/**
 * Link Preview — Mobile (React Native)
 * - Skeleton shimmer → content crossfade
 * - Reduced motion instant crossfade (≤120ms)
 * - Accessible & trimmed
 * 
 * Location: apps/mobile/src/components/chat/LinkPreview.native.tsx
 */

import React, { useMemo } from 'react'
import { View, Text, Image, TouchableOpacity, Linking, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'

export interface LinkPreviewProps {
  url: string
  title?: string
  description?: string
  image?: string
  isLoading?: boolean
  className?: string // ignored on native; kept for prop parity
}

export function LinkPreview({
  url,
  title,
  description,
  image,
  isLoading = false,
}: LinkPreviewProps) {
  const reduced = useReducedMotion()
  const showContent = !isLoading && (!!title || !!image)
  const s = useSharedValue(showContent ? 1 : 0)
  const dur = getReducedMotionDuration(360, reduced)

  useMemo(() => {
    s.value = withTiming(showContent ? 1 : 0, { duration: dur })
  }, [showContent, dur, s])

  const skeletonStyle = useAnimatedStyle(() => ({ opacity: 1 - s.value }))
  const contentStyle = useAnimatedStyle(() => ({ opacity: s.value }))

  return (
    <View style={styles.root} accessible accessibilityRole="link" accessibilityLabel={title || url}>
      {/* Skeleton */}
      <Animated.View style={[styles.absolute, skeletonStyle]}>
        <View style={styles.row}>
          {image ? <View style={[styles.thumb, styles.skel]} /> : null}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={[styles.line, styles.skel, { width: '75%' }]} />
            <View style={[styles.lineSmall, styles.skel, { width: '100%' }]} />
            <View style={[styles.lineSmall, styles.skel, { width: '66%' }]} />
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      {showContent && (
        <Animated.View style={contentStyle}>
          <TouchableOpacity onPress={() => Linking.openURL(url)} activeOpacity={0.9} style={styles.row}>
            {image ? <Image source={{ uri: image }} style={styles.thumb} /> : null}
            <View style={{ flex: 1, marginLeft: 12 }}>
              {title ? <Text numberOfLines={1} style={styles.title}>{title}</Text> : null}
              {description ? <Text numberOfLines={2} style={styles.desc}>{description}</Text> : null}
              <Text numberOfLines={1} style={styles.host}>{new URL(url).hostname}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)', padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  absolute: { ...StyleSheet.absoluteFillObject },
  thumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#222' },
  skel: { backgroundColor: 'rgba(200,200,200,0.15)' },
  line: { height: 14, borderRadius: 6, marginBottom: 8 },
  lineSmall: { height: 10, borderRadius: 5, marginBottom: 6 },
  title: { fontWeight: '600', fontSize: 14, color: '#fff' },
  desc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  host: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
})

