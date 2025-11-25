/**
 * Storybook story for useBubbleTheme hook
 * Mobile Expo story mirroring web Storybook
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useBubbleTheme } from './use-bubble-theme'
import { useDerivedValue } from 'react-native-reanimated'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    width: 200,
    height: 100,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    marginTop: 40,
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
})

function BubbleThemeDemo() {
  const { animatedStyle, gradientColors, updateTheme } = useBubbleTheme({
    senderType: 'user',
    messageType: 'default',
    theme: 'light',
  })

  const gradientColorsValue = useDerivedValue(() => {
    return gradientColors.value
  })

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, animatedStyle]}>
        <LinearGradient
          colors={gradientColorsValue.value}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.text}>Bubble Theme</Text>
      </View>
      
      <View style={styles.controls}>
        <View style={styles.button}>
          <Text style={styles.buttonText} onPress={() => { updateTheme('light'); }}>
            Light Theme
          </Text>
        </View>
        <View style={styles.button}>
          <Text style={styles.buttonText} onPress={() => { updateTheme('dark'); }}>
            Dark Theme
          </Text>
        </View>
        <View style={styles.button}>
          <Text style={styles.buttonText} onPress={() => { updateTheme('glass'); }}>
            Glass Theme
          </Text>
        </View>
        <View style={styles.button}>
          <Text style={styles.buttonText} onPress={() => { updateTheme('cyberpunk'); }}>
            Cyberpunk Theme
          </Text>
        </View>
      </View>
    </View>
  )
}

export default {
  title: 'Effects/Reanimated/useBubbleTheme',
  component: BubbleThemeDemo,
}

export const Default = () => <BubbleThemeDemo />
