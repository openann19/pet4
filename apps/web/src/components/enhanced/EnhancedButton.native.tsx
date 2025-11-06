'use client'

import React, { forwardRef, useCallback } from 'react'
import { TouchableOpacity, ViewStyle } from 'react-native'
import { MotionView } from '@petspark/motion'
import { usePressBounce, haptic } from '@petspark/motion'

export interface EnhancedButtonProps {
  onPress?: () => void
  style?: ViewStyle
  children?: React.ReactNode
  disabled?: boolean
}

export const EnhancedButton = forwardRef<any, EnhancedButtonProps>(
  ({ onPress, style, children, disabled = false }, ref) => {
    const bounceAnimation = usePressBounce(0.95)

    const handlePress = useCallback(() => {
      if (disabled || !onPress) return
      
      haptic.light()
      bounceAnimation.onPressIn()
      onPress()
      setTimeout(() => bounceAnimation.onPressOut(), 150)
    }, [disabled, onPress, bounceAnimation])

    return (
      <MotionView animatedStyle={bounceAnimation.animatedStyle}>
        <TouchableOpacity
          ref={ref}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.8}
          style={style}
        >
          {children}
        </TouchableOpacity>
      </MotionView>
    )
  }
)

EnhancedButton.displayName = 'EnhancedButton'
