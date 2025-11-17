/**
 * Floating Particle Hook - Mobile Story
 * Demonstrates the useFloatingParticle hook for mobile platforms
 */

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { useFloatingParticle } from '../use-floating-particle'

const { width, height } = Dimensions.get('window')

export default {
  title: 'Mobile/Animation Hooks/useFloatingParticle',
  component: FloatingParticleDemo,
}

interface ParticleProps {
  color?: string
  size?: number
  screenRelative?: boolean
  initialX?: number
  initialY?: number
}

function ParticleComponent({ 
  color = '#4F46E5', 
  size = 8,
  screenRelative = true,
  initialX = 0.5,
  initialY = 0.5,
}: ParticleProps) {
  const { style, start, stop, reset, isAnimating } = useFloatingParticle({
    color,
    size,
    screenRelative,
    initialX,
    initialY,
    floatDuration: 2000,
    opacity: 0.8,
  })

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
        },
        style,
      ]}
    />
  )
}

function FloatingParticleDemo() {
  const [particleCount, setParticleCount] = useState(1)
  const [isActive, setIsActive] = useState(false)

  const particles = Array.from({ length: particleCount }, (_, index) => ({
    id: index,
    color: `hsl(${String((index * 60) % 360 ?? '')}, 70%, 60%)`,
    initialX: Math.random(),
    initialY: Math.random(),
  }))

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Floating Particle Hook</Text>
        <Text style={styles.subtitle}>Mobile Implementation</Text>
      </View>

      <View style={styles.particleContainer}>
        {particles.map((particle) => (
          <ParticleComponent
            key={particle.id}
            color={particle.color}
            size={12}
            initialX={particle.initialX}
            initialY={particle.initialY}
            screenRelative={true}
          />
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isActive && styles.buttonActive]}
          onPress={() => { setIsActive(!isActive); }}
        >
          <Text style={styles.buttonText}>
            {isActive ? 'Stop Animation' : 'Start Animation'}
          </Text>
        </TouchableOpacity>

        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => { setParticleCount(Math.max(1, particleCount - 1)); }}
          >
            <Text style={styles.counterButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.counterText}>{particleCount} particles</Text>
          
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => { setParticleCount(Math.min(10, particleCount + 1)); }}
          >
            <Text style={styles.counterButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Screen-relative positioning
        </Text>
        <Text style={styles.infoText}>
          • Mobile-optimized performance
        </Text>
        <Text style={styles.infoText}>
          • Reduced motion support
        </Text>
        <Text style={styles.infoText}>
          • Smooth spring animations
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
    marginBottom: 30,
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
  particleContainer: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    margin: 10,
    position: 'relative',
  },
  controls: {
    marginTop: 20,
    gap: 16,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  counterButton: {
    backgroundColor: '#374151',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    minWidth: 100,
    textAlign: 'center',
  },
  info: {
    marginTop: 20,
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

export { FloatingParticleDemo }