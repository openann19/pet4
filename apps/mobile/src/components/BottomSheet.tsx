/**
 * Bottom sheet component with animations
 * Location: src/components/BottomSheet.tsx
 */

import React, { useEffect } from 'react'
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useModalAnimation } from '@mobile/effects/reanimated'
import { colors } from '../theme/colors'
import { springConfigs } from '@mobile/effects/reanimated/transitions'

const springConfig = springConfigs.smooth

export interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  height?: number
}

export function BottomSheet({
  visible,
  onClose,
  children,
  height = 400,
}: BottomSheetProps): React.JSX.Element {
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(height)
  const modalAnimation = useModalAnimation({ isVisible: visible, duration: 250 })

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, springConfig)
    } else {
      translateY.value = withSpring(height, springConfig)
    }
  }, [visible, height, translateY])

  // Use modal animation for backdrop opacity
  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: modalAnimation.opacity.value,
  }))

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY
      }
    })
    .onEnd((event: { translationY: number; velocityY: number }) => {
      const threshold = height * 0.3
      if (event.translationY > threshold || event.velocityY > 500) {
        translateY.value = withSpring(height, springConfig, () => {
          runOnJS(onClose)()
        })
      } else {
        translateY.value = withSpring(0, springConfig)
      }
    })

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: modalAnimation.opacity.value,
    }
  })

  if (!visible) {
    return <></>
  }

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={Object.assign({}, styles.backdrop, animatedBackdropStyle)}>
        <TouchableOpacity style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} activeOpacity={1} onPress={onClose} />
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={Object.assign({}, styles.sheet, { height, paddingBottom: insets.bottom }, animatedSheetStyle)}
          >
            <View style={styles.handle} />
            {children}
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
})
