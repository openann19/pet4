/**
 * Storybook story for useMagneticHover hook
 * Mobile Expo story mirroring web Storybook
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useMagneticHover } from './use-magnetic-hover'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: 200,
    height: 200,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    marginTop: 40,
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
})

function MagneticHoverDemo() {
  const { animatedStyle, gesture } = useMagneticHover({
    strength: 0.3,
    maxDistance: 50,
    hapticFeedback: true,
  })

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <Text style={styles.text}>Magnetic Hover</Text>
        </Animated.View>
      </GestureDetector>
      <Text style={styles.hint}>
        Press and drag to see magnetic effect
      </Text>
    </View>
  )
}

export default {
  title: 'Effects/Reanimated/useMagneticHover',
  component: MagneticHoverDemo,
}

export const Default = () => <MagneticHoverDemo />

