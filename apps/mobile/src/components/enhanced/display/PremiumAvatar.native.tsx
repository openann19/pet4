import React, { useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import type { ReactNode } from 'react'

export interface PremiumAvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'circle' | 'square' | 'rounded'
  status?: 'online' | 'offline' | 'away' | 'busy'
  badge?: string | number
  icon?: ReactNode
  fallback?: ReactNode
  onPress?: () => void
  style?: ViewStyle
  testID?: string
}

export function PremiumAvatar({
  src,
  alt,
  name,
  size = 'md',
  variant = 'circle',
  status,
  badge,
  icon,
  fallback,
  onPress,
  style,
  testID = 'premium-avatar'
}: PremiumAvatarProps): React.JSX.Element {
  const reducedMotion = useReducedMotionSV()
  const scale = useSharedValue(1)
  const glowOpacity = useSharedValue(0)

  const handlePress = useCallback(() => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress()
    }
  }, [onPress])

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value
  }))

  const getInitials = useCallback((nameStr?: string): string => {
    if (!nameStr) return ''
    const parts = nameStr.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return nameStr.substring(0, 2).toUpperCase()
  }, [])

  const sizes = {
    xs: { width: 24, height: 24, fontSize: 10 },
    sm: { width: 32, height: 32, fontSize: 12 },
    md: { width: 40, height: 40, fontSize: 14 },
    lg: { width: 48, height: 48, fontSize: 16 },
    xl: { width: 64, height: 64, fontSize: 20 }
  }

  const borderRadius = {
    circle: sizes[size].width / 2,
    square: 8,
    rounded: 12
  }[variant]

  const statusColors = {
    online: '#22c55e',
    offline: '#9ca3af',
    away: '#eab308',
    busy: '#ef4444'
  }

  const statusSizes = {
    xs: 6,
    sm: 8,
    md: 10,
    lg: 12,
    xl: 14
  }

  const badgeSizes = {
    xs: { width: 12, height: 12, fontSize: 8 },
    sm: { width: 16, height: 16, fontSize: 10 },
    md: { width: 20, height: 20, fontSize: 12 },
    lg: { width: 24, height: 24, fontSize: 14 },
    xl: { width: 28, height: 28, fontSize: 16 }
  }

  const Component = onPress ? TouchableOpacity : View

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Component
        onPress={onPress ? handlePress : undefined}
        style={[
          styles.avatar,
          {
            width: sizes[size].width,
            height: sizes[size].height,
            borderRadius
          }
        ]}
      >
        <Animated.View style={[avatarStyle, glowStyle]}>
          {src ? (
            <Animated.Image
              source={{ uri: src }}
              style={[
                styles.image,
                {
                  width: sizes[size].width,
                  height: sizes[size].height,
                  borderRadius
                }
              ]}
              accessibilityLabel={alt || name || 'Avatar'}
            />
          ) : (
            <View
              style={[
                styles.fallback,
                {
                  width: sizes[size].width,
                  height: sizes[size].height,
                  borderRadius
                }
              ]}
            >
              {icon || (
                <Text style={[styles.initials, { fontSize: sizes[size].fontSize }]}>
                  {name ? getInitials(name) : '?'}
                </Text>
              )}
              {fallback}
            </View>
          )}
        </Animated.View>

        {status && (
          <View
            style={[
              styles.status,
              {
                width: statusSizes[size],
                height: statusSizes[size],
                borderRadius: statusSizes[size] / 2,
                backgroundColor: statusColors[status],
                borderColor: '#ffffff',
                borderWidth: 2,
                bottom: 0,
                right: 0
              }
            ]}
            accessibilityLabel={`Status: ${status}`}
          />
        )}
      </Component>

      {badge && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSizes[size].width,
              height: badgeSizes[size].height,
              borderRadius: badgeSizes[size].width / 2,
              top: -badgeSizes[size].height / 2,
              right: -badgeSizes[size].width / 2
            }
          ]}
          accessibilityLabel={`Badge: ${badge}`}
        >
          <Text
            style={[
              styles.badgeText,
              {
                fontSize: badgeSizes[size].fontSize
              }
            ]}
          >
            {typeof badge === 'number' && badge > 99 ? '99+' : String(badge)}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative'
  },
  avatar: {
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  image: {
    resizeMode: 'cover'
  },
  fallback: {
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center'
  },
  initials: {
    fontWeight: '600',
    color: '#6b7280'
  },
  status: {
    position: 'absolute'
  },
  badge: {
    position: 'absolute',
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: 'bold'
  }
})
