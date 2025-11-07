/**
 * Enhanced Tab Bar Icon with animations
 * Location: src/components/navigation/TabBarIcon.tsx
 */

import React from 'react'
import { Text } from 'react-native'
import Animated from 'react-native-reanimated'
import { useNavButtonAnimation } from '@mobile/effects/reanimated'

const AnimatedText = Animated.createAnimatedComponent(Text)

export interface TabBarIconProps {
  focused: boolean
  color: string
  size: number
  icon: string
}

export function TabBarIcon({ 
  focused, 
  color, 
  size, 
  icon 
}: TabBarIconProps): React.JSX.Element {
  const animation = useNavButtonAnimation({
    isActive: focused,
    enablePulse: focused,
    pulseScale: 1.15,
    enableRotation: false,
    hapticFeedback: false
  })

  const iconStyle = React.useMemo(() => [
    { color, fontSize: size },
    animation.iconStyle,
    { opacity: focused ? 1 : 0.6 }
  ], [color, size, animation.iconStyle, focused])

  return (
    <AnimatedText style={iconStyle}>
      {icon}
    </AnimatedText>
  )
}

