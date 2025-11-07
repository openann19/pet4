/**
 * Reaction Sparkles Hook - Mobile Story
 * Demonstrates the useReactionSparkles hook for mobile chat reactions
 */

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { useReactionSparkles, type ReactionType } from './use-reaction-sparkles'

const { width, height } = Dimensions.get('window')

export default {
  title: 'Mobile/Animation Hooks/useReactionSparkles',
  component: ReactionSparklesDemo,
}

const REACTIONS: ReactionType[] = ['❤️', '👍', '😂', '😮', '😢', '🔥']

function ReactionSparklesDemo() {
  const { animate, particles, clearParticles, animatedStyle, pulseStyle } = useReactionSparkles({
    enableParticles: true,
    pulseDuration: 1000,
  })
  const [selectedReaction, setSelectedReaction] = useState<ReactionType>('❤️')

  const handleReaction = (reaction: ReactionType) => {
    setSelectedReaction(reaction)
    animate(reaction, width / 2, height / 2)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reaction Sparkles Hook</Text>
        <Text style={styles.subtitle}>Mobile Chat Reactions</Text>
      </View>

      <View style={styles.animationArea}>
        <Animated.View style={[styles.centerReaction, animatedStyle]}>
          <Text style={styles.reactionEmoji}>{selectedReaction}</Text>
        </Animated.View>

        <Animated.View style={[styles.pulseRing, pulseStyle]} />

        {particles.map((particle) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                opacity: particle.opacity.value,
                transform: [{ scale: particle.scale.value }],
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.reactionsContainer}>
        <Text style={styles.reactionsLabel}>Tap to react:</Text>
        <View style={styles.reactionsGrid}>
          {REACTIONS.map((reaction) => (
            <TouchableOpacity
              key={reaction}
              style={[
                styles.reactionButton,
                selectedReaction === reaction && styles.reactionButtonActive,
              ]}
              onPress={() => { handleReaction(reaction); }}
            >
              <Text style={styles.reactionEmojiButton}>{reaction}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.clearButton} onPress={clearParticles}>
        <Text style={styles.clearButtonText}>Clear Particles</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Tap reactions to trigger sparkle animations
        </Text>
        <Text style={styles.infoText}>
          • Particle effects with opacity and scale
        </Text>
        <Text style={styles.infoText}>
          • Pulse ring animation on reaction
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
  animationArea: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  centerReaction: {
    position: 'absolute',
    left: width / 2 - 30,
    top: height / 4 - 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionEmoji: {
    fontSize: 40,
  },
  pulseRing: {
    position: 'absolute',
    left: width / 2 - 40,
    top: height / 4 - 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
  },
  reactionsContainer: {
    marginBottom: 20,
  },
  reactionsLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  reactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reactionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reactionButtonActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  reactionEmojiButton: {
    fontSize: 24,
  },
  clearButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  clearButtonText: {
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

export { ReactionSparklesDemo }

