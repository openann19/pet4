/**
 * Wave Animation Hook - Mobile Story
 * Demonstrates the useWaveAnimation and useMultiWave hooks
 */

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { useWaveAnimation, useMultiWave } from './use-wave-animation'

export default {
  title: 'Mobile/Animation Hooks/useWaveAnimation',
  component: WaveAnimationDemo,
}

function WaveAnimationDemo() {
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal')
  const [amplitude, setAmplitude] = useState(20)
  const [enabled, setEnabled] = useState(true)

  const { animatedStyle: horizontalStyle } = useWaveAnimation({
    amplitude,
    frequency: 2,
    speed: 3000,
    direction: 'horizontal',
    enabled: enabled && direction === 'horizontal',
  })

  const { animatedStyle: verticalStyle } = useWaveAnimation({
    amplitude,
    frequency: 2,
    speed: 3000,
    direction: 'vertical',
    enabled: enabled && direction === 'vertical',
  })

  const { createWaveStyle, progress } = useMultiWave(3)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wave Animation Hook</Text>
        <Text style={styles.subtitle}>Mobile Wave Effects</Text>
      </View>

      <View style={styles.waveContainer}>
        <Text style={styles.waveLabel}>Single Wave ({direction})</Text>
        <Animated.View
          style={[
            styles.waveBox,
            direction === 'horizontal' ? horizontalStyle : verticalStyle,
          ]}
        >
          <Text style={styles.waveEmoji}>🌊</Text>
        </Animated.View>
      </View>

      <View style={styles.multiWaveContainer}>
        <Text style={styles.waveLabel}>Multi-Wave Effect</Text>
        <View style={styles.multiWaveBox}>
          {[0, 1, 2].map((index) => {
            const waveStyle = createWaveStyle(index, 15)
            return (
              <Animated.View key={index} style={[styles.multiWaveItem, waveStyle]}>
                <Text style={styles.waveEmoji}>🌊</Text>
              </Animated.View>
            )
          })}
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Direction:</Text>
          <View style={styles.directionButtons}>
            <TouchableOpacity
              style={[
                styles.directionButton,
                direction === 'horizontal' && styles.directionButtonActive,
              ]}
              onPress={() => { setDirection('horizontal'); }}
            >
              <Text style={styles.directionButtonText}>Horizontal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.directionButton,
                direction === 'vertical' && styles.directionButtonActive,
              ]}
              onPress={() => { setDirection('vertical'); }}
            >
              <Text style={styles.directionButtonText}>Vertical</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Amplitude: {amplitude}</Text>
          <View style={styles.amplitudeButtons}>
            <TouchableOpacity
              style={styles.amplitudeButton}
              onPress={() => { setAmplitude(Math.max(5, amplitude - 5)); }}
            >
              <Text style={styles.amplitudeButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.amplitudeButton}
              onPress={() => { setAmplitude(Math.min(50, amplitude + 5)); }}
            >
              <Text style={styles.amplitudeButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.toggleButton, enabled && styles.toggleButtonActive]}
          onPress={() => { setEnabled(!enabled); }}
        >
          <Text style={styles.toggleButtonText}>
            {enabled ? 'Disable' : 'Enable'} Animation
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Horizontal and vertical wave animations
        </Text>
        <Text style={styles.infoText}>
          • Multi-wave layered effects
        </Text>
        <Text style={styles.infoText}>
          • Configurable amplitude and frequency
        </Text>
        <Text style={styles.infoText}>
          • Smooth continuous animations
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  waveContainer: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  waveLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  waveBox: {
    width: 200,
    height: 100,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveEmoji: {
    fontSize: 32,
  },
  multiWaveContainer: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  multiWaveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    height: 100,
  },
  multiWaveItem: {
    width: 60,
    height: 60,
    backgroundColor: '#4F46E5',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    marginBottom: 20,
    gap: 16,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  directionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  directionButton: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  directionButtonActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  directionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  amplitudeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  amplitudeButton: {
    backgroundColor: '#374151',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amplitudeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#10B981',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    padding: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  infoText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 4,
  },
})

export { WaveAnimationDemo }

