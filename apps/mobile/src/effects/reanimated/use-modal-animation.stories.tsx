/**
 * Modal Animation Hook - Mobile Story
 * Demonstrates the useModalAnimation hook for mobile modal transitions
 */

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import Animated from 'react-native-reanimated'
import { useModalAnimation } from './use-modal-animation'

export default {
  title: 'Mobile/Animation Hooks/useModalAnimation',
  component: ModalAnimationDemo,
}

function AnimatedModal({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  const { style } = useModalAnimation({
    isVisible,
    duration: 300,
    delay: 0,
  })

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <Animated.View style={[styles.modalContent, style]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Animated Modal</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                This modal uses the useModalAnimation hook for smooth entrance and exit animations.
              </Text>
              <Text style={styles.modalText}>
                The animation includes fade, scale, and slide effects optimized for mobile.
              </Text>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButton} onPress={onClose}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

function ModalAnimationDemo() {
  const [isVisible, setIsVisible] = useState(false)
  const [delay, setDelay] = useState(0)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Modal Animation Hook</Text>
        <Text style={styles.subtitle}>Mobile Modal Transitions</Text>
      </View>

      <View style={styles.demoArea}>
        <Text style={styles.demoText}>
          Tap the button below to open an animated modal
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isVisible && styles.buttonActive]}
          onPress={() => { setIsVisible(!isVisible); }}
        >
          <Text style={styles.buttonText}>
            {isVisible ? 'Close' : 'Open'} Modal
          </Text>
        </TouchableOpacity>

        <View style={styles.delayControl}>
          <Text style={styles.delayLabel}>Delay: {delay}ms</Text>
          <View style={styles.delayButtons}>
            <TouchableOpacity
              style={styles.delayButton}
              onPress={() => { setDelay(Math.max(0, delay - 100)); }}
            >
              <Text style={styles.delayButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.delayButton}
              onPress={() => { setDelay(Math.min(1000, delay + 100)); }}
            >
              <Text style={styles.delayButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Smooth fade, scale, and slide animations
        </Text>
        <Text style={styles.infoText}>
          • Configurable delay for entrance
        </Text>
        <Text style={styles.infoText}>
          • Spring-based transitions
        </Text>
        <Text style={styles.infoText}>
          • Mobile-optimized performance
        </Text>
      </View>

      <AnimatedModal isVisible={isVisible} onClose={() => { setIsVisible(false); }} />
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
    alignItems: 'center',
  },
  demoText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  controls: {
    marginBottom: 20,
    gap: 16,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  delayControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 8,
  },
  delayLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  delayButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  delayButton: {
    backgroundColor: '#4F46E5',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delayButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#374151',
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    color: '#D1D5DB',
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 24,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
  },
  modalButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
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

export { ModalAnimationDemo }

