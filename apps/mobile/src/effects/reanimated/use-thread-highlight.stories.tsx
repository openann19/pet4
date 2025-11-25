/**
 * Thread Highlight Hook - Mobile Demo
 * Demonstrates the useThreadHighlight hook for mobile chat highlighting
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { useThreadHighlight } from '../use-thread-highlight'

export default {
  title: 'Mobile/Animation Hooks/useThreadHighlight',
  component: ThreadHighlightDemo,
}

interface MessageProps {
  text: string
  isThread?: boolean
  color?: string
}

function MessageComponent({ text, isThread = false, color = '#4F46E5' }: MessageProps) {
  const { style, toggle, isHighlighted } = useThreadHighlight({
    highlightColor: color,
    glowRadius: 8,
    enablePulse: isThread,
    autoDismissAfter: isThread ? 3000 : 0,
  })

  return (
    <Animated.View style={[styles.messageContainer, style]}>
      <View style={styles.messageContent}>
        <Text style={styles.messageText}>{text}</Text>
        {isThread && <Text style={styles.threadBadge}>Thread</Text>}
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isHighlighted && styles.buttonActive]}
          onPress={toggle}
        >
          <Text style={styles.buttonText}>
            {isHighlighted ? 'Unhighlight' : 'Highlight'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

function ThreadHighlightDemo() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Thread Highlight Hook</Text>
        <Text style={styles.subtitle}>Mobile Chat Implementation</Text>
      </View>

      <View style={styles.chatContainer}>
        <MessageComponent
          text="Regular message - tap to highlight"
          color="#4F46E5"
        />
        
        <MessageComponent
          text="Thread message with auto-pulse"
          isThread={true}
          color="#10B981"
        />
        
        <MessageComponent
          text="Important message"
          color="#EF4444"
        />
        
        <MessageComponent
          text="Another thread message"
          isThread={true}
          color="#F59E0B"
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Tap messages to toggle highlight
        </Text>
        <Text style={styles.infoText}>
          • Thread messages auto-dismiss after 3s
        </Text>
        <Text style={styles.infoText}>
          • Thread messages have pulse effect
        </Text>
        <Text style={styles.infoText}>
          • Reduced motion support
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
  chatContainer: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  messageContainer: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  threadBadge: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  controls: {
    alignItems: 'flex-start',
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonActive: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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

export { ThreadHighlightDemo }