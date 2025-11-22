/**
 * Media Bubble Hook - Mobile Story
 * Demonstrates the useMediaBubble hook for mobile chat media messages
 */

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native'
import Animated from 'react-native-reanimated'
import { useMediaBubble, type MediaType } from './use-media-bubble'

export default {
  title: 'Mobile/Animation Hooks/useMediaBubble',
  component: MediaBubbleDemo,
}

const MEDIA_TYPES: MediaType[] = ['image', 'video', 'audio']

function MediaBubbleComponent({ mediaType }: { mediaType: MediaType }) {
  const [isZoomed, setIsZoomed] = useState(false)
  const {
    imageStyle,
    zoomModalStyle,
    waveformStyles,
    handleImageLoad,
    handleImageTap,
    closeZoom,
  } = useMediaBubble({
    mediaType,
    onZoom: () => { setIsZoomed(true); },
  })

  const handleTap = () => {
    handleImageTap()
    setIsZoomed(true)
  }

  const handleClose = () => {
    closeZoom()
    setIsZoomed(false)
  }

  return (
    <>
      <Animated.View style={[styles.mediaBubble, imageStyle]}>
        <TouchableOpacity onPress={handleTap} activeOpacity={0.9}>
          <View style={styles.mediaContent}>
            {mediaType === 'image' && (
              <Image
                source={{ uri: 'https://picsum.photos/300/200' }}
                style={styles.mediaImage}
                onLoad={handleImageLoad}
              />
            )}
            {mediaType === 'video' && (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.mediaIcon}>▶️</Text>
                <Text style={styles.mediaLabel}>Video</Text>
              </View>
            )}
            {mediaType === 'audio' && (
              <View style={styles.audioContainer}>
                <View style={styles.waveformContainer}>
                  {waveformStyles.map((style, index) => (
                    <Animated.View
                      key={index}
                      style={[styles.waveformBar, style]}
                    />
                  ))}
                </View>
                <Text style={styles.audioLabel}>Voice Message</Text>
              </View>
            )}
            <Text style={styles.mediaTypeLabel}>{mediaType}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={isZoomed} transparent animationType="fade" onRequestClose={handleClose}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View style={[styles.zoomModal, zoomModalStyle]}>
            <Image
              source={{ uri: 'https://picsum.photos/800/600' }}
              style={styles.zoomImage}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

function MediaBubbleDemo() {
  const [selectedType, setSelectedType] = useState<MediaType>('image')

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Media Bubble Hook</Text>
        <Text style={styles.subtitle}>Mobile Chat Media</Text>
      </View>

      <View style={styles.mediaContainer}>
        <MediaBubbleComponent mediaType={selectedType} />
      </View>

      <View style={styles.typeSelector}>
        <Text style={styles.selectorLabel}>Media Type:</Text>
        <View style={styles.typeButtons}>
          {MEDIA_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                selectedType === type && styles.typeButtonActive,
              ]}
              onPress={() => { setSelectedType(type); }}
            >
              <Text style={styles.typeButtonText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          • Tap media to zoom/fullscreen
        </Text>
        <Text style={styles.infoText}>
          • Smooth scale and opacity transitions
        </Text>
        <Text style={styles.infoText}>
          • Waveform animation for audio
        </Text>
        <Text style={styles.infoText}>
          • Mobile-optimized media handling
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
  mediaContainer: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mediaBubble: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#374151',
  },
  mediaContent: {
    width: 300,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  mediaIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  mediaLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  audioContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 12,
    height: 60,
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#4F46E5',
    borderRadius: 2,
    minHeight: 20,
  },
  audioLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  mediaTypeLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#FFFFFF',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomModal: {
    width: '90%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  typeSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  typeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
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

export { MediaBubbleDemo }

