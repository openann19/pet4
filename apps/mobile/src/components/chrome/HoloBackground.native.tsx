/**
 * HoloBackground Component (Mobile)
 * 
 * Subtle animated gradient background that "breathes"
 * Respects reduced motion preferences
 */

import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming 
} from 'react-native-reanimated'
import { useReducedMotionSV } from '../../effects/chat/core/reduced-motion'
import { useFeatureFlags } from '../../config/feature-flags'

export interface HoloBackgroundNativeProps {
  intensity?: number
}

export default function HoloBackgroundNative({ 
  intensity = 0.6 
}: HoloBackgroundNativeProps): React.JSX.Element {
  const reducedMotion = useReducedMotionSV()
  const { enableHoloBackground } = useFeatureFlags()
  const t = useSharedValue(0)
  
  useEffect(() => {
    if (!enableHoloBackground || reducedMotion.value) {
      return
    }
    
    t.value = withRepeat(
      withTiming(1, { duration: 6000 }),
      -1,
      true
    )
  }, [t, reducedMotion, enableHoloBackground])
  
  const style = useAnimatedStyle(() => {
    if (reducedMotion.value || !enableHoloBackground) {
      return {
        opacity: 1,
        transform: [{ scale: 1 }],
      }
    }
    
    return {
      opacity: 1,
      transform: [{ scale: 1.05 + t.value * 0.02 }],
    }
  })
  
  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.gradient,
          { opacity: intensity },
          style
        ]} 
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#141428',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#6C7CFF33',
  },
})
