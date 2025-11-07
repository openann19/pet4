import React from 'react'
import { View, ViewStyle } from 'react-native'
import { MotionView } from '@petspark/motion'
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PremiumCardProps {
  variant?: 'default' | 'glass' | 'elevated' | 'gradient'
  style?: ViewStyle
  children?: React.ReactNode
}

export function PremiumCard({
  variant = 'default',
  style,
  children,
}: PremiumCardProps) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 220 })
    translateY.value = withTiming(0, { duration: 220 })
  }, [opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const variants = {
    default: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' },
    glass: { backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' },
    elevated: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    gradient: { backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
  }

  return (
    <MotionView
      animatedStyle={animatedStyle}
      style={[
        {
          borderRadius: 12,
          padding: 24,
        },
        variants[variant],
        style
      ]}
    >
      {children}
    </MotionView>
  )
}
