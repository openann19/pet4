import React, { memo, useCallback, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { usePressAnimation } from '@mobile/hooks/use-press-animation'
import { colors } from '@mobile/theme/colors'
import * as Haptics from 'expo-haptics'

const SPRING_CONFIG = { damping: 15, stiffness: 400 }
const BOUNCY_SPRING = { damping: 12, stiffness: 500 }

export type TabKey = 'community' | 'chat' | 'feed' | 'adopt' | 'matches' | 'profile'

export interface BottomItem {
  key: TabKey
  label: string
  icon?: string
  badge?: number
}

interface BottomNavBarProps {
  active: TabKey
  items: BottomItem[]
  onChange: (key: TabKey) => void
}

export function BottomNavBar({
  active,
  items,
  onChange,
}: BottomNavBarProps): React.ReactElement {
  const barOpacity = useSharedValue(0)
  const barY = useSharedValue(50)

  useEffect(() => {
    barOpacity.value = withDelay(200, withTiming(1, { duration: 400 }))
    barY.value = withDelay(200, withSpring(0, SPRING_CONFIG))
  }, [barOpacity, barY])

  const barStyle = useAnimatedStyle(() => {
    return {
      opacity: barOpacity.value,
      transform: [{ translateY: barY.value }],
    }
  })

  const handlePress = useCallback(
    (key: TabKey): void => {
      if (key !== active) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
        onChange(key)
      }
    },
    [active, onChange]
  )

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe} accessibilityRole="tablist">
      <Animated.View style={[styles.container, barStyle]}>
        {/* Glow background effect */}
        <View style={styles.glowBackground} />
        
        {/* Glassmorphism overlay */}
        <View style={styles.glassOverlay} />
        
        {/* Content */}
        <View style={styles.bar}>
          {items.map((it, index) => {
            const selected = it.key === active
            return (
              <TabItem
                key={it.key}
                item={it}
                selected={selected}
                index={index}
                onPress={() => {
                  handlePress(it.key)
                }}
              />
            )
          })}
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: 'transparent',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: colors.accent,
    opacity: 0.05,
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
    position: 'relative',
    zIndex: 10,
  },
  item: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 16,
    position: 'relative',
  },
  itemActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    backgroundColor: colors.danger,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  iconGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 40,
    height: 40,
    marginTop: -20,
    marginLeft: -20,
    borderRadius: 20,
    backgroundColor: colors.accent,
    opacity: 0.2,
  },
})

interface TabItemProps {
  item: BottomItem
  selected: boolean
  index: number
  onPress: () => void
}

function TabItem({ item, selected, index, onPress }: TabItemProps): React.ReactElement {
  const iconScale = useSharedValue(selected ? 1.15 : 1)
  const iconY = useSharedValue(selected ? -2 : 0)
  const iconOpacity = useSharedValue(selected ? 1 : 0.7)
  const glowOpacity = useSharedValue(selected ? 1 : 0)
  const indicatorOpacity = useSharedValue(selected ? 1 : 0)
  const indicatorScale = useSharedValue(selected ? 1 : 0)
  const pulseScale = useSharedValue(1)

  const { animatedStyle, handlePressIn, handlePressOut } = usePressAnimation({
    scaleAmount: 0.9,
    hapticFeedback: false,
    enableBounce: true,
  })

  useEffect(() => {
    const delay = index * 30
    
    if (selected) {
      iconScale.value = withDelay(delay, withSpring(1.15, BOUNCY_SPRING))
      iconY.value = withDelay(delay, withSpring(-2, SPRING_CONFIG))
      iconOpacity.value = withDelay(delay, withTiming(1, { duration: 300 }))
      glowOpacity.value = withDelay(delay, withSpring(1, SPRING_CONFIG))
      indicatorOpacity.value = withDelay(delay, withTiming(1, { duration: 300 }))
      indicatorScale.value = withDelay(delay, withSpring(1, BOUNCY_SPRING))
      
      // Pulse animation for active item
      pulseScale.value = withDelay(
        delay + 200,
        withSequence(
          withSpring(1.2, BOUNCY_SPRING),
          withSpring(1, SPRING_CONFIG)
        )
      )
    } else {
      iconScale.value = withSpring(1, SPRING_CONFIG)
      iconY.value = withSpring(0, SPRING_CONFIG)
      iconOpacity.value = withTiming(0.7, { duration: 200 })
      glowOpacity.value = withTiming(0, { duration: 200 })
      indicatorOpacity.value = withTiming(0, { duration: 200 })
      indicatorScale.value = withSpring(0, SPRING_CONFIG)
    }
  }, [selected, index, iconScale, iconY, iconOpacity, glowOpacity, indicatorOpacity, indicatorScale, pulseScale])

  const iconAnimatedStyle = useAnimatedStyle(() => {
    const combinedScale = iconScale.value * pulseScale.value
    return {
      transform: [
        { scale: combinedScale },
        { translateY: iconY.value }
      ],
      opacity: iconOpacity.value,
    }
  })

  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value * 0.3,
      transform: [{ scale: iconScale.value }],
    }
  })

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: indicatorOpacity.value,
      transform: [{ scale: indicatorScale.value }],
    }
  })

  const badgeScale = useSharedValue(1)
  const badgeOpacity = useSharedValue(item.badge && item.badge > 0 ? 1 : 0)

  useEffect(() => {
    if (item.badge && item.badge > 0) {
      badgeOpacity.value = withTiming(1, { duration: 200 })
      badgeScale.value = withSequence(
        withSpring(1.3, BOUNCY_SPRING),
        withSpring(1, SPRING_CONFIG)
      )
    } else {
      badgeOpacity.value = withTiming(0, { duration: 200 })
    }
  }, [item.badge, badgeOpacity, badgeScale])

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: badgeOpacity.value,
      transform: [{ scale: badgeScale.value }],
    }
  })

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.item, selected && styles.itemActive]}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={item.label}
      >
        {/* Glow effect for active item */}
        {selected && (
          <Animated.View style={[styles.iconGlow, glowAnimatedStyle]} />
        )}

        {/* Icon */}
        {item.icon && (
          <Animated.Text style={[{ fontSize: 24 }, iconAnimatedStyle]}>
            {item.icon}
          </Animated.Text>
        )}

        {/* Label */}
        <Text
          style={[styles.label, selected && styles.labelActive]}
          numberOfLines={1}
        >
          {item.label}
        </Text>

        {/* Active indicator */}
        <Animated.View style={[styles.activeIndicator, indicatorAnimatedStyle]} />

        {/* Badge */}
        {item.badge && item.badge > 0 && (
          <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
            <Text style={styles.badgeText}>
              {item.badge > 9 ? '9+' : String(item.badge)}
            </Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  )
}

export default memo(BottomNavBar)
