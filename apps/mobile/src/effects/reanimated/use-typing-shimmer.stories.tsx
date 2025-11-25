/**
 * Typing Shimmer Hook - Mobile Story
 * Demonstrates the useTypingShimmer hook for mobile typing indicators
 */

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useTypingShimmer } from './use-typing-shimmer'
import { isTruthy } from '@petspark/shared';

export default {
  title: 'Mobile/Animation Hooks/useTypingShimmer',
  component: TypingShimmerDemo,
}

function TypingIndicator({ isComplete }: { isComplete: boolean }) {
  const {
    shimmerStyle,
    placeholderStyle,
    contentStyle,
    start,
    stop,
    reveal,
  } = useTypingShimmer({
    duration: 2000,
    shimmerWidth: 200,
    enabled: true,
    isComplete,
  })

  React.useEffect(() => {
    if (isTruthy(isComplete)) {
      reveal()
    } else {
      start()
    }
    return () => {
      stop()
    }
  }, [isComplete, start, stop, reveal])

  return (
    <View style={styles.indicatorContainer}>
      <Animated.View style={[styles.placeholderContainer, placeholderStyle]}>
        <View style={styles.shimmerContainer}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.shimmer, shimmerStyle]}
          />
          <View style={styles.dotsContainer}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.contentContainer, contentStyle]}>
        <Text style={styles.contentText}>Message received!</Text>
      </Animated.View>
    </View>
  )
}

function TypingShimmerDemo() {
  const [isComplete, setIsComplete] = useState(false)
  const [showMultiple, setShowMultiple] = useState(false)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Typing Shimmer Hook</Text>
        <Text style={styles.subtitle}>Mobile Typing Indicators</Text>
      </View>

      <View style={styles.indicatorsContainer}>
        <View style={styles.indicatorWrapper}>
          <Text style={styles.indicatorLabel}>Typing...</Text>
          <TypingIndicator isComplete={isComplete} />
        </View>

        {showMultiple && (
          <>
            <View style={styles.indicatorWrapper}>
              <Text style={styles.indicatorLabel}>Another user...</Text>
              <TypingIndicator isComplete={false} />
            </View>
            <View style={styles.indicatorWrapper}>
              <Text style={styles.indicatorLabel}>Completed</Text>
              <TypingIndicator isComplete={true} />
            </View>
          </>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isComplete && styles.buttonActive]}
          onPress={() => { setIsComplete(!isComplete); }}
        >
          <Text style={styles.buttonText}>
            {isComplete ? 'Reset' : 'Complete'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, showMultiple && styles.buttonActive]}
          onPress={() => { setShowMultiple(!showMultiple); }}
        >
          <Text style={styles.buttonText}>
            {showMultiple ? 'Hide' : 'Show'} Multiple
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Shimmer effect during typing
        </Text>
        <Text style={styles.infoText}>
          • Smooth reveal animation when complete
        </Text>
        <Text style={styles.infoText}>
          • Placeholder to content transition
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
  indicatorsContainer: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    gap: 24,
  },
  indicatorWrapper: {
    gap: 8,
  },
  indicatorLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  indicatorContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
    overflow: 'hidden',
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  contentText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  buttonText: {
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

export { TypingShimmerDemo }
