/**
 * Storybook story for useAnimatePresence hook
 * Mobile Expo story mirroring web Storybook
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Animated from 'react-native-reanimated'
import { useAnimatePresence } from './use-animate-presence'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    width: 200,
    height: 200,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
})

function AnimatePresenceDemo() {
  const [isVisible, setIsVisible] = useState(true)
  const { animatedStyle, shouldRender } = useAnimatePresence({
    isVisible,
    enterTransition: 'fade',
    exitTransition: 'fade',
  })

  if (!shouldRender) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => { setIsVisible(true); }}
        >
          <Text style={styles.buttonText}>Show</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.box, animatedStyle]}>
        <Text style={styles.text}>Animate Presence</Text>
      </Animated.View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => { setIsVisible(!isVisible); }}
      >
        <Text style={styles.buttonText}>
          {isVisible ? 'Hide' : 'Show'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default {
  title: 'Effects/Reanimated/useAnimatePresence',
  component: AnimatePresenceDemo,
}

export const Default = () => <AnimatePresenceDemo />

