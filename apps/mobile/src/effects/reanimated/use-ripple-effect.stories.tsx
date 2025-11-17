/**
 * Ripple Effect Hook - Mobile Story
 * Demonstrates the useRippleEffect hook for mobile touch feedback
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { useRippleEffect } from './use-ripple-effect'

export default {
  title: 'Mobile/Animation Hooks/useRippleEffect',
  component: RippleEffectDemo,
}

function RippleButton({ label }: { label: string }): JSX.Element {
  const { triggerRipple, rippleStyle } = useRippleEffect()

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => { triggerRipple(); }}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.ripple, rippleStyle]} />
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  )
}

function RippleEffectDemo(): JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ripple Effect Hook</Text>
        <Text style={styles.subtitle}>Mobile Touch Feedback</Text>
      </View>

      <View style={styles.demoArea}>
        <Text style={styles.instructionText}>
          Tap the buttons below to see ripple effects
        </Text>

        <View style={styles.buttonsContainer}>
          <RippleButton label="Primary Button" />
          <RippleButton label="Secondary Button" />
          <RippleButton label="Action Button" />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Ripple Effect</Text>
          <Text style={styles.infoText}>
            The ripple effect provides visual feedback when users interact with touchable elements.
            It creates a smooth, expanding circle animation that originates from the touch point.
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Tap to trigger ripple animation
        </Text>
        <Text style={styles.infoText}>
          • Scale and opacity transitions
        </Text>
        <Text style={styles.infoText}>
          • Smooth 600ms animation
        </Text>
        <Text style={styles.infoText}>
          • Mobile-optimized touch feedback
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
  demoArea: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: '50%',
    left: '50%',
    marginTop: -100,
    marginLeft: -100,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
  info: {
    padding: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
})

export { RippleEffectDemo }

