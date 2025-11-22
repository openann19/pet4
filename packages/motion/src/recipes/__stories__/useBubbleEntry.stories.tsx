/**
 * useBubbleEntry Examples
 * Interactive examples of the bubble entry animation hook
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native'
import { useBubbleEntry, type UseBubbleEntryOptions } from '../useBubbleEntry'
import Animated from 'react-native-reanimated'

// Story wrapper component
interface BubbleEntryDemoProps extends UseBubbleEntryOptions {
  backgroundColor?: string
  text?: string
  width?: number
  height?: number
}

function BubbleEntryDemo({
  backgroundColor = '#3B82F6',
  text = 'Message Bubble',
  width = 200,
  height = 60,
  ...options
}: BubbleEntryDemoProps) {
  const { style, enter, exit, reset, isVisible, isAnimating } = useBubbleEntry(options)

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={enter}>
          <Text style={styles.buttonText}>Enter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={exit}>
          <Text style={styles.buttonText}>Exit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={reset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.status}>
        <Text style={styles.statusText}>
          Visible: {isVisible ? '✅' : '❌'} | Animating: {isAnimating ? '🔄' : '⏸️'}
        </Text>
      </View>

      <View style={styles.animationArea}>
        <Animated.View
          style={[
            style,
            {
              backgroundColor,
              width,
              height,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }
          ]}
        >
          <Text style={styles.bubbleText}>{text}</Text>
        </Animated.View>
      </View>
    </View>
  )
}

// Staggered demo component
interface StaggeredBubbleProps {
  readonly message: string
  readonly index: number
  readonly shouldAnimate: boolean
}

function StaggeredBubble({ message, index, shouldAnimate }: StaggeredBubbleProps) {
  const { style, enter, reset } = useBubbleEntry({
    index,
    staggerDelay: 100,
    direction: index % 2 === 0 ? 'left' : 'right',
    autoTrigger: false
  })

  React.useEffect(() => {
    if (!shouldAnimate) {
      reset()
      return undefined
    }

    const timeout = setTimeout(() => {
      enter()
    }, index * 100)

    return () => {
      clearTimeout(timeout)
    }
  }, [enter, index, reset, shouldAnimate])

  const backgroundColor = index % 2 === 0 ? '#3B82F6' : '#10B981'
  const alignmentStyle: ViewStyle = { alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end' }

  return (
    <Animated.View
      style={[
        style,
        {
          backgroundColor,
          padding: 12,
          margin: 8,
          borderRadius: 16,
          maxWidth: 250,
        },
        alignmentStyle
      ]}
    >
      <Text style={styles.bubbleText}>{message}</Text>
    </Animated.View>
  )
}

function StaggeredBubbleDemo() {
  const [shouldAnimate, setShouldAnimate] = useState(false)
  
  const messages = [
    'Hello there! 👋',
    'How are you doing?',
    'This is a staggered animation',
    'Each bubble enters with a delay',
    'Pretty cool, right? ✨'
  ]

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => { setShouldAnimate(true); }}
        >
          <Text style={styles.buttonText}>Start Stagger</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => { setShouldAnimate(false); }}
        >
          <Text style={styles.buttonText}>Reset All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.chatContainer}>
        {messages.map((message, index) => (
          <StaggeredBubble
            key={message}
            message={message}
            index={index}
            shouldAnimate={shouldAnimate}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB'
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 10
  },
  button: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14
  },
  status: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 8
  },
  statusText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'monospace'
  },
  animationArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bubbleText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center'
  },
  chatContainer: {
    flex: 1,
    paddingVertical: 20
  }
})

// Example configurations
export const exampleConfigs = {
  default: {
    direction: 'bottom' as const,
    distance: 30,
    entryDuration: 400,
    staggerDelay: 50,
    enableBounce: true,
    autoTrigger: false
  },
  
  fromTop: {
    direction: 'top' as const,
    distance: 40,
    entryDuration: 350
  },
  
  fromLeft: {
    direction: 'left' as const,
    distance: 35,
    entryDuration: 300
  },
  
  fromRight: {
    direction: 'right' as const,
    distance: 35,
    entryDuration: 300
  },
  
  fastEntry: {
    entryDuration: 200,
    enableBounce: false,
    distance: 20
  },
  
  slowEntry: {
    entryDuration: 800,
    distance: 60,
    enableBounce: true
  },
  
  largeScale: {
    initialScale: 0.3,
    finalScale: 1.2,
    entryDuration: 500
  },
  
  staggered: {
    staggerDelay: 100,
    entryDuration: 400,
    enableBounce: true
  }
}

// Export components for use in other projects
export { BubbleEntryDemo, StaggeredBubbleDemo }