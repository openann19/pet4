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
    withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'
import { isTruthy, isDefined } from '@/core/guards';

const springConfig = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
}

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
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (isTruthy(visible)) {
      translateY.value = withSpring(0, springConfig)
      opacity.value = withTiming(1, { duration: 200 })
    } else {
      translateY.value = withSpring(height, springConfig)
      opacity.value = withTiming(0, { duration: 200 })
    }
  }, [visible, height, translateY, opacity])

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY
      }
    })
    .onEnd((event) => {
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
    }
  })

  const animatedBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    }
  })

  if (!visible) {
    return <></>
  }

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              { height, paddingBottom: insets.bottom },
              animatedSheetStyle,
            ]}
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

