import React, { useCallback, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  measure,
  runOnUI,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'

const AnimatedView = Animated.View
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface PremiumTab {
  value: string
  label: string
  icon?: React.ReactNode
  badge?: number | string
  disabled?: boolean
}

export interface PremiumTabsProps {
  tabs: PremiumTab[]
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  variant?: 'default' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  scrollable?: boolean
  style?: ViewStyle
  testID?: string
  children?: React.ReactNode
}

const SPRING_CONFIG = { stiffness: 400, damping: 20 }

export function PremiumTabs({
  tabs,
  value,
  onValueChange,
  defaultValue,
  variant = 'default',
  size = 'md',
  scrollable = false,
  style,
  testID = 'premium-tabs',
  children,
}: PremiumTabsProps): React.JSX.Element {
  const containerRef = useRef<View>(null)
  const tabRefs = useRef<(View | null)[]>([])
  const indicatorPosition = useSharedValue(0)
  const indicatorWidth = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()
  const activeTab = value || defaultValue || tabs[0]?.value

  const updateIndicator = useCallback(() => {
    const activeIndex = tabs.findIndex(tab => tab.value === activeTab)
    if (activeIndex >= 0 && tabRefs.current[activeIndex]) {
      const tabRef = tabRefs.current[activeIndex]
      // For Animated refs, getNode() returns the underlying component
      const node = (tabRef as any)?.getNode ? (tabRef as any).getNode() : tabRef
      if (node) {
        runOnUI(() => {
          'worklet'
          const measurements = measure(node)
          if (measurements) {
            indicatorPosition.value = reducedMotion.value
              ? withTiming(measurements.pageX, { duration: 200 })
              : withSpring(measurements.pageX, SPRING_CONFIG)
            indicatorWidth.value = reducedMotion.value
              ? withTiming(measurements.width, { duration: 200 })
              : withSpring(measurements.width, SPRING_CONFIG)
          }
        })()
      }
    }
  }, [tabs, activeTab, indicatorPosition, indicatorWidth, reducedMotion])

  useEffect(() => {
    updateIndicator()
  }, [updateIndicator, activeTab])

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: indicatorWidth.value,
  }))

  const handleTabPress = useCallback(
    (tabValue: string): void => {
      onValueChange?.(tabValue)
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setTimeout(updateIndicator, 100)
    },
    [onValueChange, updateIndicator]
  )

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingVertical: 6, paddingHorizontal: 12 },
    md: { paddingVertical: 8, paddingHorizontal: 16 },
    lg: { paddingVertical: 10, paddingHorizontal: 20 },
  }

  const TabList = scrollable ? ScrollView : View

  return (
    <View style={[styles.container, style]} testID={testID}>
      <TabList
        ref={containerRef}
        horizontal={scrollable}
        showsHorizontalScrollIndicator={false}
        style={[
          styles.tabList,
          variant === 'default' && styles.tabListDefault,
          variant === 'pills' && styles.tabListPills,
          variant === 'underline' && styles.tabListUnderline,
        ]}
        contentContainerStyle={scrollable ? styles.scrollContent : undefined}
      >
        {variant === 'underline' && <AnimatedView style={[styles.indicator, indicatorStyle]} />}
        {tabs.map((tab, index) => {
          const isActive = tab.value === activeTab
          return (
            <AnimatedPressable
              key={tab.value}
              ref={ref => {
                tabRefs.current[index] = ref
              }}
              onPress={() => handleTabPress(tab.value)}
              disabled={tab.disabled}
              style={[
                styles.tab,
                sizeStyles[size],
                variant === 'default' && [styles.tabDefault, isActive && styles.tabDefaultActive],
                variant === 'pills' && [styles.tabPills, isActive && styles.tabPillsActive],
                variant === 'underline' && [
                  styles.tabUnderline,
                  isActive && styles.tabUnderlineActive,
                ],
                tab.disabled && styles.tabDisabled,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive, disabled: tab.disabled }}
            >
              {tab.icon && <View style={styles.tabIcon}>{tab.icon}</View>}
              <Text
                style={[
                  styles.tabLabel,
                  sizeStyles[size],
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
              {tab.badge !== undefined && (
                <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                  <Text
                    style={[
                      styles.badgeText,
                      isActive ? styles.badgeTextActive : styles.badgeTextInactive,
                    ]}
                  >
                    {tab.badge}
                  </Text>
                </View>
              )}
            </AnimatedPressable>
          )
        })}
      </TabList>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabList: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  tabListDefault: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  tabListPills: {
    gap: 8,
  },
  tabListUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#3b82f6',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabDefault: {
    borderRadius: 6,
  },
  tabDefaultActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabPills: {
    borderRadius: 9999,
    backgroundColor: '#f1f5f9',
  },
  tabPillsActive: {
    backgroundColor: '#3b82f6',
  },
  tabUnderline: {
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabUnderlineActive: {
    borderBottomColor: '#3b82f6',
  },
  tabDisabled: {
    opacity: 0.5,
  },
  tabIcon: {
    marginRight: 4,
  },
  tabLabel: {
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#000000',
  },
  tabLabelInactive: {
    color: '#64748b',
  },
  badge: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#ffffff',
  },
  badgeTextInactive: {
    color: '#64748b',
  },
})
