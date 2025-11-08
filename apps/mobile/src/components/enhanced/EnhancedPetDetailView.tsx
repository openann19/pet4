/**
 * EnhancedPetDetailView - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/EnhancedPetDetailView.tsx
 */

import React, { useCallback, useState } from 'react'
import { View, Text, ScrollView, Image, Pressable, StyleSheet, Modal } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
// import { useSwipeGesture } from '@/hooks/use-swipe-gesture'
import { PremiumCard } from './PremiumCard'
import { PremiumButton } from './PremiumButton'
import type { Pet } from '@/lib/types'
import { timingConfigs, springConfigs } from '@/effects/reanimated/transitions'

const AnimatedView = Animated.createAnimatedComponent(View)
const AnimatedImage = Animated.createAnimatedComponent(Image)

export interface EnhancedPetDetailViewProps {
  pet: Pet
  onClose: () => void
  onLike?: () => void
  onPass?: () => void
  onChat?: () => void
  compatibilityScore?: number
  matchReasons?: string[]
  showActions?: boolean
}

export function EnhancedPetDetailView({
  pet,
  onClose,
  onLike,
  onPass,
  onChat,
  compatibilityScore,
  matchReasons,
  showActions = true,
}: EnhancedPetDetailViewProps): React.JSX.Element | null {
  // const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const photos = pet.photos && pet.photos.length > 0 ? pet.photos : [pet.photo]

  const modalOpacity = useSharedValue(0)
  const modalScale = useSharedValue(0.95)
  const imageOpacity = useSharedValue(1)

  React.useEffect(() => {
    modalOpacity.value = withTiming(1, timingConfigs.smooth)
    modalScale.value = withSpring(1, springConfigs.smooth)
  }, [modalOpacity, modalScale])

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }))

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }))

  const handleClose = useCallback(() => {
    modalOpacity.value = withTiming(0, timingConfigs.fast)
    modalScale.value = withTiming(0.95, timingConfigs.fast)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 200)
  }, [onClose, modalOpacity, modalScale])

  // const handleNextPhoto = useCallback(() => {
  //   imageOpacity.value = withTiming(0, { duration: 150 })
  //   setTimeout(() => {
  //     setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  //     imageOpacity.value = withTiming(1, { duration: 150 })
  //   }, 150)
  //   void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  // }, [photos.length, imageOpacity])

  // const handlePrevPhoto = useCallback(() => {
  //   imageOpacity.value = withTiming(0, { duration: 150 })
  //   setTimeout(() => {
  //     setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  //     imageOpacity.value = withTiming(1, { duration: 150 })
  //   }, 150)
  //   void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  // }, [photos.length, imageOpacity])

  // const swipeGesture = useSwipeGesture({
  //   onSwipeLeft: handleNextPhoto,
  //   onSwipeRight: handlePrevPhoto,
  //   threshold: 50,
  // })

  const handleLike = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onLike?.()
  }, [onLike])

  const handlePass = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPass?.()
  }, [onPass])

  const handleChat = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChat?.()
  }, [onChat])

  if (!isVisible) {
    return null
  }

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <AnimatedView style={[styles.modal, modalStyle]}>
          <Pressable onPress={e => e.stopPropagation()}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Photo Gallery */}
              <View style={styles.imageContainer}>
                <AnimatedImage
                  source={{ uri: photos[0] }}
                  style={[styles.image, imageStyle]}
                  resizeMode="cover"
                />
                {photos.length > 1 && (
                  <View style={styles.photoIndicator}>
                    <Text style={styles.photoIndicatorText}>1 / {photos.length}</Text>
                  </View>
                )}
              </View>

              {/* Content */}
              <View style={styles.body}>
                <View style={styles.header}>
                  <Text style={styles.name}>{pet.name}</Text>
                  {pet.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.location}>{pet.location}</Text>

                {compatibilityScore !== undefined && (
                  <PremiumCard variant="elevated" style={styles.compatibilityCard}>
                    <Text style={styles.compatibilityScore}>{compatibilityScore}%</Text>
                    <Text style={styles.compatibilityLabel}>Compatibility</Text>
                  </PremiumCard>
                )}

                {matchReasons && matchReasons.length > 0 && (
                  <PremiumCard variant="default" style={styles.reasonsCard}>
                    <Text style={styles.sectionTitle}>Why you match</Text>
                    {matchReasons.map((reason, index) => (
                      <Text key={index} style={styles.reasonText}>
                        • {reason}
                      </Text>
                    ))}
                  </PremiumCard>
                )}

                <PremiumCard variant="default" style={styles.infoCard}>
                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.infoText}>
                    {pet.breed} • {pet.age} years • {pet.gender}
                  </Text>
                  {pet.personality && pet.personality.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {pet.personality.map((trait, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{trait}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </PremiumCard>
              </View>

              {/* Actions */}
              {showActions && (
                <View style={styles.actions}>
                  <PremiumButton variant="ghost" onPress={handlePass} style={styles.actionButton}>
                    Pass
                  </PremiumButton>
                  {onChat && (
                    <PremiumButton
                      variant="secondary"
                      onPress={handleChat}
                      style={styles.actionButton}
                    >
                      Chat
                    </PremiumButton>
                  )}
                  <PremiumButton variant="primary" onPress={handleLike} style={styles.actionButton}>
                    Like
                  </PremiumButton>
                </View>
              )}
            </ScrollView>
          </Pressable>

          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </AnimatedView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  photoIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  body: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  location: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  compatibilityCard: {
    marginBottom: 16,
    alignItems: 'center',
    padding: 24,
  },
  compatibilityScore: {
    fontSize: 48,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 8,
  },
  compatibilityLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  reasonsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#475569',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
})
