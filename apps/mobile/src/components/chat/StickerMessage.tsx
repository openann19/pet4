import React, { useState, useCallback, useEffect } from 'react'
import { StyleSheet, Text, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withSpring, Layout } from '@petspark/motion'
import type { Sticker } from '../../lib/sticker-library'
import {
  useStickerAnimation,
  type StickerAnimationType,
} from '../../effects/reanimated/use-sticker-animation'
import { springConfigs } from '../../effects/reanimated/transitions'
import * as Haptics from 'expo-haptics'
import { isTruthy } from '../../utils/shared';

export interface StickerMessageProps {
  sticker: Sticker
  isOwn?: boolean
  onHover?: () => void
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  testID?: string
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

export function StickerMessage({
  sticker,
  isOwn = false,
  onHover,
  onPress,
  style,
  testID = 'sticker-message',
}: StickerMessageProps): React.JSX.Element {
  const [isPressed, setIsPressed] = useState(false)

  const entryOpacity = useSharedValue(0)
  const entryScale = useSharedValue(0.5)

  const stickerAnimation = useStickerAnimation({
    animation: sticker.animation as StickerAnimationType | undefined,
    enabled: isPressed && Boolean(sticker.animation),
  })

  const pressScale = useSharedValue(1)

  useEffect(() => {
    entryOpacity.value = withSpring(1, springConfigs.smooth)
    entryScale.value = withSpring(1, springConfigs.bouncy)
  }, [entryOpacity, entryScale])

  const handlePressIn = useCallback(() => {
    setIsPressed(true)
    pressScale.value = withSpring(0.95, springConfigs.smooth)
    if (isTruthy(sticker.animation)) {
      stickerAnimation.trigger()
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onHover?.()
  }, [sticker.animation, stickerAnimation, pressScale, onHover])

  const handlePressOut = useCallback(() => {
    setIsPressed(false)
    pressScale.value = withSpring(1, springConfigs.smooth)
    stickerAnimation.reset()
  }, [stickerAnimation, pressScale])

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress?.()
  }, [onPress])

  const entryStyle = useAnimatedStyle(() => {
    return {
      opacity: entryOpacity.value,
      transform: [{ scale: entryScale.value }],
    }
  })

  const pressStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pressScale.value }],
    }
  })

  return (
    <Animated.View
      style={[
        styles.container,
        isOwn ? styles.containerOwn : styles.containerOther,
        entryStyle,
        style,
      ]}
      layout={Layout.springify()}
      testID={testID}
    >
      <AnimatedTouchable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.stickerContainer,
          isPressed && styles.stickerContainerPressed,
          stickerAnimation.animatedStyle,
          pressStyle,
        ]}
        testID={`${String(testID ?? '')}-sticker`}
      >
        <Text style={styles.emoji} testID={`${String(testID ?? '')}-emoji`}>
          {sticker.emoji}
        </Text>
      </AnimatedTouchable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  containerOwn: {
    justifyContent: 'flex-end',
  },
  containerOther: {
    justifyContent: 'flex-start',
  },
  stickerContainer: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  stickerContainerPressed: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  emoji: {
    fontSize: 32,
    textAlign: 'center',
  },
})
