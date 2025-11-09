import React, { memo, useCallback, useEffect } from 'react'
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavBarAnimation, useNavButtonAnimation } from '../effects/reanimated'
import { colors } from '../theme/colors'
import * as Haptics from 'expo-haptics'

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

export function BottomNavBar({ active, items, onChange }: BottomNavBarProps): React.ReactElement {
  const navBarAnimation = useNavBarAnimation({ delay: 200 })

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
      <Animated.View style={Object.assign({}, styles.container, navBarAnimation.navStyle)}>
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
    borderTopWidth: 0.5,
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
  index?: number
  onPress: () => void
}

function TabItem({ item, selected, onPress }: TabItemProps): React.ReactElement {
  const animation = useNavButtonAnimation({
    isActive: selected,
    enablePulse: selected,
    pulseScale: 1.2,
    enableRotation: false,
    hapticFeedback: true,
  })

  const glowOpacity = useSharedValue(selected ? 1 : 0)
  const badgeScale = useSharedValue(1)
  const badgeOpacity = useSharedValue(item.badge && item.badge > 0 ? 1 : 0)

  useEffect(() => {
    if (selected) {
      glowOpacity.value = withSpring(1, { damping: 20, stiffness: 400 })
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 })
    }
  }, [selected, glowOpacity])

  useEffect(() => {
    if (item.badge && item.badge > 0) {
      badgeOpacity.value = withTiming(1, { duration: 200 })
      badgeScale.value = withSequence(
        withSpring(1.3, { damping: 12, stiffness: 500 }),
        withSpring(1, { damping: 15, stiffness: 400 })
      )
    } else {
      badgeOpacity.value = withTiming(0, { duration: 200 })
    }
  }, [item.badge, badgeOpacity, badgeScale])

  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value * 0.3,
      transform: [{ scale: animation.iconScale.value }],
    }
  })

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: badgeOpacity.value,
      transform: [{ scale: badgeScale.value }],
    }
  })

  return (
    <Animated.View style={animation.buttonStyle}>
      <TouchableOpacity
        onPress={() => {
          animation.handlePress()
          onPress()
        }}
        onPressIn={animation.handlePressIn}
        onPressOut={animation.handlePressOut}
        style={[styles.item, selected && styles.itemActive]}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={item.label}
        activeOpacity={1}
      >
        {/* Glow effect for active item */}
        {selected && (
          <Animated.View style={Object.assign({}, styles.iconGlow, glowAnimatedStyle)} />
        )}

        {/* Icon */}
        {item.icon && (
          <Animated.Text
            style={[{ fontSize: 24 }, animation.iconStyle, { opacity: selected ? 1 : 0.7 }]}
          >
            {item.icon}
          </Animated.Text>
        )}

        {/* Label */}
        <Text style={[styles.label, selected && styles.labelActive]} numberOfLines={1}>
          {item.label}
        </Text>

        {/* Active indicator */}
        <Animated.View
          style={Object.assign({}, styles.activeIndicator, animation.indicatorStyle)}
        />

        {/* Badge */}
        {item.badge && item.badge > 0 && (
          <Animated.View style={Object.assign({}, styles.badge, badgeAnimatedStyle)}>
            <Text style={styles.badgeText}>{item.badge > 9 ? '9+' : String(item.badge)}</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

export default memo(BottomNavBar)
