import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'

export interface TrustBadgesProps {
  badges: Array<{
    type: 'verified' | 'health' | 'responsive' | 'experienced' | 'top-rated' | 'favorite'
    label: string
    description: string
  }>
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

const BADGE_CONFIG = {
  verified: {
    icon: '✓',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  health: {
    icon: '❤️',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  responsive: {
    icon: '⚡',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  experienced: {
    icon: '⭐',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  'top-rated': {
    icon: '🏆',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  favorite: {
    icon: '✨',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
}

const SIZE_CONFIG = {
  sm: { iconSize: 14, containerSize: 28, gap: 4 },
  md: { iconSize: 18, containerSize: 36, gap: 8 },
  lg: { iconSize: 22, containerSize: 44, gap: 10 },
}

export function TrustBadges({ badges, size = 'md', animated = true }: TrustBadgesProps): React.JSX.Element | null {
  if (!badges || !Array.isArray(badges) || badges.length === 0) {
    return null
  }

  const sizeConfig = SIZE_CONFIG[size]

  return (
    <View style={[styles.container, { gap: sizeConfig.gap }]}>
      {badges.map((badge, index) => (
        <BadgeAnimated
          key={badge.type}
          index={index}
          animated={animated}
          sizeConfig={sizeConfig}
          badge={badge}
        />
      ))}
    </View>
  )
}

function BadgeAnimated({
  index,
  animated,
  sizeConfig,
  badge,
}: {
  index: number
  animated: boolean
  sizeConfig: typeof SIZE_CONFIG.md
  badge: TrustBadgesProps['badges'][0]
}) {
  const scale = useSharedValue(animated ? 0.8 : 1)
  const opacity = useSharedValue(animated ? 0 : 1)
  const reducedMotion = useReducedMotionSV()
  const config = BADGE_CONFIG[badge.type]

  React.useEffect(() => {
    if (animated && !reducedMotion.value) {
      const delay = index * 50
      setTimeout(() => {
        scale.value = withSpring(1, { stiffness: 500, damping: 30 })
        opacity.value = withSpring(1, { stiffness: 500, damping: 30 })
      }, delay)
    } else if (animated) {
      scale.value = withTiming(1, { duration: 200 })
      opacity.value = withTiming(1, { duration: 200 })
    }
  }, [animated, scale, opacity, index, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge.label}
      accessibilityHint={badge.description}
    >
      <Animated.View
        style={[
          styles.badge,
          {
            width: sizeConfig.containerSize,
            height: sizeConfig.containerSize,
            borderRadius: sizeConfig.containerSize / 2,
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
          },
          animatedStyle,
        ]}
      >
        <Text style={[styles.icon, { fontSize: sizeConfig.iconSize, color: config.color }]}>
          {config.icon}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  badge: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    fontWeight: 'bold',
  },
})

