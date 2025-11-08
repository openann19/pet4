/**
 * MediaViewer Component
 *
 * Premium media viewer component integrating:
 * - Glass morph zoom effect
 * - Sticker physics for stickers
 * - Shared element transitions
 *
 * Location: apps/mobile/src/components/chat/MediaViewer.tsx
 */

import React, { useCallback, useEffect } from 'react'
import { Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Animated, { FadeIn, FadeOut, useAnimatedStyle } from 'react-native-reanimated'
import { useGlassMorphZoom } from '../../effects/chat/media/use-glass-morph-zoom'
import { useStickerPhysics } from '../../effects/chat/media/use-sticker-physics'
import { ChromaticAberrationFX } from '../../effects/chat/shaders/chromatic-aberration'
import { createLogger } from '../../utils/logger'

const logger = createLogger('MediaViewer')

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

/**
 * Media type
 */
export type MediaType = 'image' | 'video' | 'sticker'

/**
 * MediaViewer props
 */
export interface MediaViewerProps {
  visible: boolean
  mediaUri: string
  mediaType: MediaType
  onClose: () => void
}

/**
 * MediaViewer component
 */
export function MediaViewer({
  visible,
  mediaUri,
  mediaType,
  onClose,
}: MediaViewerProps): React.ReactElement {
  // Glass morph zoom effect
  const glassZoom = useGlassMorphZoom({
    enabled: true,
    blurRadius: 12,
    onComplete: () => {
      logger.debug('Glass zoom animation completed')
    },
  })

  // Sticker physics (only for stickers)
  const stickerPhysics = useStickerPhysics({
    enabled: mediaType === 'sticker',
    initialVelocity: { x: 0, y: -400 },
    floorY: SCREEN_HEIGHT * 0.8,
    onComplete: () => {
      logger.debug('Sticker physics animation completed')
    },
  })

  // Open modal
  useEffect(() => {
    if (visible) {
      // Set aberration center to image center
      glassZoom.aberrationCenter.value = {
        x: (SCREEN_WIDTH - 40) / 2,
        y: (SCREEN_HEIGHT - 40) / 2,
      }
      glassZoom.open()
      if (mediaType === 'sticker') {
        stickerPhysics.trigger()
      }
    } else {
      glassZoom.close()
    }
  }, [visible, mediaType, glassZoom, stickerPhysics])

  // Handle close
  const handleClose = useCallback(() => {
    glassZoom.close()
    setTimeout(() => {
      onClose()
    }, 300)
  }, [glassZoom, onClose])

  // Animated backdrop style
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: glassZoom.blurOpacity.value,
  }))

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
      >
        <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={handleClose}>
          <Animated.View
            style={[
              styles.mediaContainer,
              glassZoom.animatedStyle,
              mediaType === 'sticker' ? stickerPhysics.animatedStyle : undefined,
            ]}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
          >
            {mediaType === 'image' && (
              <View style={styles.imageContainer}>
                {/* ChromaticAberrationFX for image open effect */}
                <ChromaticAberrationFX
                  uri={mediaUri}
                  width={SCREEN_WIDTH - 40}
                  height={SCREEN_HEIGHT - 40}
                  center={glassZoom.aberrationCenter}
                  radius={glassZoom.aberrationRadius}
                  intensity={glassZoom.aberrationIntensity}
                />
                <Image source={{ uri: mediaUri }} style={styles.image} resizeMode="contain" />
              </View>
            )}
            {mediaType === 'video' && (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoText}>Video Preview</Text>
              </View>
            )}
            {mediaType === 'sticker' && (
              <Image source={{ uri: mediaUri }} style={styles.sticker} resizeMode="contain" />
            )}
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  backdropTouchable: {
    flex: 1,
  },
  mediaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imageContainer: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT - 40,
    position: 'relative',
  },
  image: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT - 40,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  videoPlaceholder: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT - 40,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  sticker: {
    width: 200,
    height: 200,
  },
})
