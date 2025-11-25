/**
 * Confetti Burst Hook - Mobile Story
 * Demonstrates the useConfettiBurst hook for mobile celebration effects
 */

import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { useConfettiBurst } from './use-confetti-burst'

const { width, height } = Dimensions.get('window')

export default {
  title: 'Mobile/Animation Hooks/useConfettiBurst',
  component: ConfettiBurstDemo,
}

function ConfettiBurstDemo(): JSX.Element {
  const { burst, particles, createParticleStyle, isAnimating } = useConfettiBurst({
    particleCount: 30,
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#bb8fce'],
    duration: 2000,
    spread: 200,
  })

  const handleBurst = (): void => {
    burst(width / 2, height / 4)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Confetti Burst Hook</Text>
        <Text style={styles.subtitle}>Mobile Celebration Effects</Text>
      </View>

      <View style={styles.animationArea}>
        {particles.map((particle) => {
          const particleStyle = createParticleStyle(particle)
          return (
            <Animated.View
              key={particle.id}
              style={[
                styles.particle,
                {
                  backgroundColor: particle.color,
                  width: particle.size,
                  height: particle.size,
                },
                particleStyle,
              ]}
            />
          )
        })}

        {!isAnimating && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>🎉</Text>
            <Text style={styles.placeholderLabel}>Tap to burst confetti!</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.burstButton, isAnimating && styles.burstButtonActive]}
        onPress={() => { handleBurst(); }}
        disabled={isAnimating}
      >
        <Text style={styles.burstButtonText}>
          {isAnimating ? 'Bursting...' : 'Burst Confetti!'}
        </Text>
      </TouchableOpacity>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Particles</Text>
          <Text style={styles.statValue}>{particles.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Status</Text>
          <Text style={styles.statValue}>{isAnimating ? 'Active' : 'Ready'}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Tap to trigger confetti burst
        </Text>
        <Text style={styles.infoText}>
          • Multiple colored particles
        </Text>
        <Text style={styles.infoText}>
          • Physics-based animation
        </Text>
        <Text style={styles.infoText}>
          • Mobile-optimized performance
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
  animationArea: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  placeholder: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderLabel: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  particle: {
    position: 'absolute',
    borderRadius: 4,
  },
  burstButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  burstButtonActive: {
    backgroundColor: '#6B7280',
  },
  burstButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
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

export { ConfettiBurstDemo }

