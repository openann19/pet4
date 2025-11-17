/**
 * Receipt Transition Hook - Mobile Story
 * Demonstrates the useReceiptTransition hook for mobile message status indicators
 */

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { useReceiptTransition, type MessageStatus } from './use-receipt-transition'

export default {
  title: 'Mobile/Animation Hooks/useReceiptTransition',
  component: ReceiptTransitionDemo,
}

const STATUSES: MessageStatus[] = ['sending', 'sent', 'delivered', 'read', 'failed']

const getStatusStyleKey = (status: MessageStatus): keyof typeof styles => {
  const capitalized = status.charAt(0).toUpperCase() + status.slice(1)
  return `status${String(capitalized ?? '')}` as keyof typeof styles
}

function ReceiptIcon({ status, previousStatus }: { status: MessageStatus; previousStatus?: MessageStatus }) {
  const { animatedStyle, animateStatusChange } = useReceiptTransition({
    status,
    previousStatus,
    pulseDuration: 600,
  })

  React.useEffect(() => {
    if (previousStatus && previousStatus !== status) {
      animateStatusChange(status)
    }
  }, [status, previousStatus, animateStatusChange])

  const getIcon = () => {
    switch (status) {
      case 'sending':
        return '⏳'
      case 'sent':
        return '✓'
      case 'delivered':
        return '✓✓'
      case 'read':
        return '✓✓'
      case 'failed':
        return '✕'
      default:
        return '✓'
    }
  }

  return (
    <Animated.View style={[styles.iconContainer, animatedStyle]}>
      <Text style={styles.iconText}>{getIcon()}</Text>
    </Animated.View>
  )
}

function ReceiptTransitionDemo() {
  const [currentStatus, setCurrentStatus] = useState<MessageStatus>('sending')
  const [previousStatus, setPreviousStatus] = useState<MessageStatus | undefined>(undefined)
  const [autoProgress, setAutoProgress] = useState(false)

  React.useEffect(() => {
    if (!autoProgress) return

    const intervals: Record<MessageStatus, number> = {
      sending: 1000,
      sent: 1500,
      delivered: 2000,
      read: 0,
      failed: 0,
    }

    const timeout = setTimeout(() => {
      const currentIndex = STATUSES.indexOf(currentStatus)
      if (currentIndex < STATUSES.length - 1) {
        setPreviousStatus(currentStatus)
        setCurrentStatus(STATUSES[currentIndex + 1])
      }
    }, intervals[currentStatus])

    return () => { clearTimeout(timeout); }
  }, [currentStatus, autoProgress])

  const handleStatusChange = (status: MessageStatus) => {
    setPreviousStatus(currentStatus)
    setCurrentStatus(status)
  }

  const reset = () => {
    setPreviousStatus(undefined)
    setCurrentStatus('sending')
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receipt Transition Hook</Text>
        <Text style={styles.subtitle}>Mobile Message Status</Text>
      </View>

      <View style={styles.demoArea}>
        <View style={styles.messageContainer}>
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>Sample message</Text>
          </View>
          <ReceiptIcon status={currentStatus} previousStatus={previousStatus} />
        </View>

        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>Current Status:</Text>
          <Text style={[styles.statusValue, styles[getStatusStyleKey(currentStatus)]]}>
            {currentStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Text style={styles.controlsLabel}>Change Status:</Text>
        <View style={styles.statusButtons}>
          {STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                currentStatus === status && styles.statusButtonActive,
              ]}
              onPress={() => { handleStatusChange(status); }}
            >
              <Text style={styles.statusButtonText}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, autoProgress && styles.buttonActive]}
          onPress={() => { setAutoProgress(!autoProgress); }}
        >
          <Text style={styles.buttonText}>
            {autoProgress ? 'Stop' : 'Start'} Auto Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={reset}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Smooth transitions between statuses
        </Text>
        <Text style={styles.infoText}>
          • Color and scale animations
        </Text>
        <Text style={styles.infoText}>
          • Pulse effect on status change
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
  demoArea: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 20,
  },
  messageBubble: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 16,
    maxWidth: '70%',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  statusInfo: {
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusSending: {
    color: '#9CA3AF',
  },
  statusSent: {
    color: '#9CA3AF',
  },
  statusDelivered: {
    color: '#60A5FA',
  },
  statusRead: {
    color: '#3B82F6',
  },
  statusFailed: {
    color: '#EF4444',
  },
  controls: {
    marginBottom: 20,
    gap: 16,
  },
  controlsLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusButtonActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  button: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonActive: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
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

export { ReceiptTransitionDemo }

