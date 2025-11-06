'use client'

import React, { useCallback, useState } from 'react'
import {
  Calendar,
  ChatCircle,
  Heart,
  Lightning,
  MapPin,
  PawPrint,
  ShieldCheck,
  Star,
  TrendUp,
  Users,
  X
} from '@phosphor-icons/react'
import { MotionView, usePressBounce, haptic } from '@petspark/motion'
import type { Pet } from '@petspark/shared'
import { TouchableOpacity, StyleSheet, Dimensions, Image, View, Text, ScrollView } from 'react-native'

const { width: screenWidth } = Dimensions.get('window')

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
  showActions = true
}: EnhancedPetDetailViewProps): React.JSX.Element {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const photos = pet.photos && pet.photos.length > 0 ? pet.photos : [pet.photo]

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleNextPhoto = useCallback((): void => {
    setIsLoading(true)
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
    haptic.light()
  }, [photos.length])

  const handlePrevPhoto = useCallback((): void => {
    setIsLoading(true)
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
    haptic.light()
  }, [photos.length])

  const handleImageLoad = useCallback((): void => {
    setIsLoading(false)
  }, [])

  const handleImageError = useCallback((): void => {
    setIsLoading(false)
  }, [])

  const handleLike = useCallback(() => {
    haptic.medium()
    onLike?.()
  }, [onLike])

  const handlePass = useCallback(() => {
    haptic.light()
    onPass?.()
  }, [onPass])

  const handleChat = useCallback(() => {
    haptic.light()
    onChat?.()
  }, [onChat])

  const trustScore = pet.trustScore ?? 0
  const getTrustLevel = useCallback((score: number) => {
    if (score >= 80) return { label: 'Highly Trusted', color: '#22c55e' }
    if (score >= 60) return { label: 'Trusted', color: '#3b82f6' }
    if (score >= 40) return { label: 'Established', color: '#eab308' }
    return { label: 'New', color: '#6b7280' }
  }, [])

  const trustLevel = getTrustLevel(trustScore)

  return (
    <View style={styles.backdrop}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <CloseButton onClose={handleClose} />
        </View>

        <ScrollView style={styles.scrollArea}>
          {/* Photo Gallery */}
          <View style={styles.photoContainer}>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <View style={styles.spinner} />
              </View>
            )}
            <Image
              source={{ uri: photos[currentPhotoIndex] }}
              style={styles.photoImage}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />

            {photos.length > 1 && (
              <>
                <View style={styles.navButtons}>
                  <PhotoNavButton onClick={handlePrevPhoto} />
                  <PhotoNavButton onClick={handleNextPhoto} />
                </View>
                <View style={styles.indicators}>
                  {photos.map((_: string, idx: number) => (
                    <PhotoIndicator
                      key={idx}
                      index={idx}
                      isActive={idx === currentPhotoIndex}
                      onClick={() => {
                        setIsLoading(true)
                        setCurrentPhotoIndex(idx)
                      }}
                    />
                  ))}
                </View>
              </>
            )}

            {compatibilityScore !== undefined && (
              <CompatibilityBadge score={compatibilityScore} />
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Header Info */}
            <PetHeader pet={pet} trustScore={trustScore} trustLevel={trustLevel} />

            {/* Match Reasons */}
            {matchReasons && matchReasons.length > 0 && (
              <MatchReasonsCard reasons={matchReasons} />
            )}

            {/* Tabs */}
            <PetTabs pet={pet} />
          </View>
        </ScrollView>

        {/* Actions */}
        {showActions && (
          <ActionButtons
            onLike={onLike ? handleLike : undefined}
            onPass={onPass ? handlePass : undefined}
            onChat={onChat ? handleChat : undefined}
          />
        )}
      </View>
    </View>
  )
}

interface CloseButtonProps {
  onClose: () => void
}

function CloseButton({ onClose }: CloseButtonProps): React.JSX.Element {
  const bounce = usePressBounce(0.95)

  const handlePress = useCallback(() => {
    haptic.light()
    onClose()
  }, [onClose])

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.closeButton}
    >
      <MotionView style={bounce.animatedStyle}>
        <X size={24} weight="bold" color="#000" />
      </MotionView>
    </TouchableOpacity>
  )
}

interface PhotoNavButtonProps {
  onClick: () => void
}

function PhotoNavButton({ onClick }: PhotoNavButtonProps): React.JSX.Element {
  const bounce = usePressBounce(0.95)

  const handlePress = useCallback(() => {
    haptic.light()
    onClick()
  }, [onClick])

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.navButton}
    >
      <MotionView style={bounce.animatedStyle}>
        <PawPrint size={20} weight="fill" color="#fff" />
      </MotionView>
    </TouchableOpacity>
  )
}

interface PhotoIndicatorProps {
  index: number
  isActive: boolean
  onClick: () => void
}

function PhotoIndicator({ isActive, onClick }: PhotoIndicatorProps): React.JSX.Element {
  return (
    <TouchableOpacity
      onPress={onClick}
      style={[styles.indicator, isActive && styles.indicatorActive]}
    >
      <View style={styles.indicatorInner} />
    </TouchableOpacity>
  )
}

interface CompatibilityBadgeProps {
  score: number
}

function CompatibilityBadge({ score }: CompatibilityBadgeProps): React.JSX.Element {
  return (
    <View style={styles.compatibilityBadge}>
      <View style={styles.compatibilityContent}>
        <TrendUp size={20} weight="bold" color="#fff" />
        <Text style={styles.compatibilityText}>{score}% Match</Text>
      </View>
    </View>
  )
}

interface PetHeaderProps {
  pet: Pet
  trustScore: number
  trustLevel: { label: string; color: string }
}

function PetHeader({ pet, trustScore, trustLevel }: PetHeaderProps): React.JSX.Element {
  return (
    <View style={styles.petHeader}>
      <View style={styles.petTitle}>
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petBreed}>
          {pet.breed} • {pet.age} {pet.age === 1 ? 'year' : 'years'}
        </Text>
      </View>
      {trustScore > 0 && (
        <View style={styles.trustContainer}>
          <ShieldCheck size={20} color={trustLevel.color} weight="fill" />
          <Text style={[styles.trustLabel, { color: trustLevel.color }]}>
            {trustLevel.label}
          </Text>
          <Text style={styles.trustScore}>Trust Score: {trustScore}</Text>
        </View>
      )}

      <View style={styles.locationContainer}>
        <MapPin size={16} weight="fill" color="#6b7280" />
        <Text style={styles.locationText}>{pet.location}</Text>
      </View>
    </View>
  )
}

interface MatchReasonsCardProps {
  reasons: string[]
}

function MatchReasonsCard({ reasons }: MatchReasonsCardProps): React.JSX.Element {
  return (
    <View style={styles.matchReasonsCard}>
      <View style={styles.matchReasonsContent}>
        <Text style={styles.matchReasonsTitle}>
          <Star size={20} color="#f59e0b" weight="fill" /> Why This Match Works
        </Text>
        <View style={styles.reasonsList}>
          {reasons.map((reason, idx) => (
            <MatchReasonItem key={idx} reason={reason} index={idx} />
          ))}
        </View>
      </View>
    </View>
  )
}

interface MatchReasonItemProps {
  reason: string
  index: number
}

function MatchReasonItem({ reason }: MatchReasonItemProps): React.JSX.Element {
  return (
    <View style={styles.reasonItem}>
      <Heart size={14} color="#dc2626" weight="fill" />
      <Text style={styles.reasonText}>{reason}</Text>
    </View>
  )
}

interface PetTabsProps {
  pet: Pet
}

function PetTabs({ pet }: PetTabsProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState('about')

  return (
    <View style={styles.tabsContainer}>
      <View style={styles.tabList}>
        <TouchableOpacity
          style={[styles.tabTrigger, activeTab === 'about' && styles.tabActive]}
          onPress={() => setActiveTab('about')}
        >
          <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
            About
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabTrigger, activeTab === 'personality' && styles.tabActive]}
          onPress={() => setActiveTab('personality')}
        >
          <Text style={[styles.tabText, activeTab === 'personality' && styles.tabTextActive]}>
            Personality
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabTrigger, activeTab === 'stats' && styles.tabActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'about' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bioText}>{pet.bio}</Text>

          {pet.interests && pet.interests.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestsContainer}>
                {pet.interests.map((interest: string, idx: number) => (
                  <Text key={idx} style={styles.interestBadge}>
                    {interest}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {pet.lookingFor && pet.lookingFor.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Looking For</Text>
              <View style={styles.interestsContainer}>
                {pet.lookingFor.map((item: string, idx: number) => (
                  <Text key={idx} style={styles.interestBadge}>
                    {item}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {activeTab === 'personality' && (
        <View style={styles.tabContent}>
          {pet.personality && pet.personality.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Personality Traits</Text>
              <View style={styles.personalityGrid}>
                {pet.personality.map((trait: string, idx: number) => (
                  <PersonalityTrait key={idx} trait={trait} index={idx} />
                ))}
              </View>
            </View>
          )}

          <View>
            <Text style={styles.sectionTitle}>Activity Level</Text>
            <View style={styles.activityContainer}>
              <Text style={styles.activityLabel}>Energy</Text>
              <Text style={styles.activityValue}>{pet.activityLevel ?? 'Moderate'}</Text>
            </View>
            <View style={styles.progressBar} />
          </View>
        </View>
      )}

      {activeTab === 'stats' && (
        <View style={styles.tabContent}>
          <View style={styles.statsGrid}>
            <StatCard
              icon={Users}
              label="Playdates"
              value={String(pet.playdateCount ?? 0)}
              color="#10b981"
            />
            <StatCard
              icon={Star}
              label="Rating"
              value={pet.overallRating?.toFixed(1) ?? 'N/A'}
              color="#f59e0b"
            />
            <StatCard
              icon={Lightning}
              label="Response Rate"
              value={`${Math.round((pet.responseRate ?? 0) * 100)}%`}
              color="#6366f1"
            />
            <StatCard
              icon={Calendar}
              label="Member Since"
              value={String(new Date(pet.createdAt ?? Date.now()).getFullYear())}
              color="#8b5cf6"
            />
          </View>

          {pet.badges && pet.badges.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Trust Badges</Text>
              <View style={styles.badgesContainer}>
                {pet.badges.map((badge: { label: string }, idx: number) => (
                  <TrustBadgeItem key={idx} badge={badge} index={idx} />
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

interface PersonalityTraitProps {
  trait: string
  index: number
}

function PersonalityTrait({ trait }: PersonalityTraitProps): React.JSX.Element {
  return (
    <View style={styles.personalityTrait}>
      <PawPrint size={24} color="#3b82f6" weight="fill" />
      <Text style={styles.traitText}>{trait}</Text>
    </View>
  )
}

interface StatCardProps {
  icon: React.ComponentType<any>
  label: string
  value: string
  color: string
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps): React.JSX.Element {
  return (
    <View style={styles.statCard}>
      <View style={styles.statContent}>
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: color }]}>
            <Icon size={24} weight="duotone" color="#fff" />
          </View>
          <View>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

interface TrustBadgeItemProps {
  badge: { label: string }
  index: number
}

function TrustBadgeItem({ badge }: TrustBadgeItemProps): React.JSX.Element {
  return (
    <View style={styles.trustBadge}>
      <ShieldCheck size={14} color="#10b981" weight="fill" />
      <Text style={styles.badgeText}>{badge.label}</Text>
    </View>
  )
}

interface ActionButtonsProps {
  onLike?: (() => void) | undefined
  onPass?: (() => void) | undefined
  onChat?: (() => void) | undefined
}

function ActionButtons({ onLike, onPass, onChat }: ActionButtonsProps): React.JSX.Element {
  return (
    <View style={styles.actionButtons}>
      <View style={styles.buttonRow}>
        {onPass && (
          <ActionButton
            variant="outline"
            icon={X}
            label="Pass"
            onClick={onPass}
          />
        )}
        {onChat && (
          <ActionButton
            variant="secondary"
            icon={ChatCircle}
            label="Chat"
            onClick={onChat}
          />
        )}
        {onLike && (
          <ActionButton
            variant="primary"
            icon={Heart}
            label="Like"
            onClick={onLike}
            style={styles.likeButton}
          />
        )}
      </View>
    </View>
  )
}

interface ActionButtonProps {
  variant: 'outline' | 'secondary' | 'primary'
  icon: React.ComponentType<any>
  label: string
  onClick: () => void
  style?: any
}

function ActionButton({ variant, icon: Icon, label, onClick, style }: ActionButtonProps): React.JSX.Element {
  const bounce = usePressBounce(0.95)

  const handlePress = useCallback(() => {
    haptic.light()
    onClick()
  }, [onClick])

  const buttonStyle = [
    styles.actionButton,
    variant === 'primary' && styles.primaryButton,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'outline' && styles.outlineButton,
    style
  ]

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={buttonStyle}
    >
      <View style={bounce.animatedStyle}>
        <Icon size={20} weight={variant === 'primary' ? 'fill' : 'bold'} color="#fff" />
        <Text style={styles.buttonText}>{label}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: screenWidth * 0.95,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
  },
  header: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  photoContainer: {
    height: 300,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  spinner: {
    width: 48,
    height: 48,
    borderWidth: 4,
    borderColor: '#3b82f6',
    borderTopColor: 'transparent',
    borderRadius: 24,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  navButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicators: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  indicatorActive: {
    width: 24,
  },
  indicatorInner: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  compatibilityBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  compatibilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
  },
  compatibilityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 24,
    gap: 24,
  },
  petHeader: {
    gap: 8,
  },
  petTitle: {
    gap: 4,
  },
  petName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  petBreed: {
    fontSize: 18,
    color: '#6b7280',
  },
  trustContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustLabel: {
    fontSize: 16,
    fontWeight: 'semibold',
  },
  trustScore: {
    fontSize: 14,
    color: '#6b7280',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  matchReasonsCard: {
    borderColor: 'rgba(59, 130, 246, 0.2)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  matchReasonsContent: {
    padding: 16,
    gap: 12,
  },
  matchReasonsTitle: {
    fontSize: 16,
    fontWeight: 'semibold',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reasonsList: {
    gap: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  tabsContainer: {
    width: '100%',
  },
  tabList: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
  },
  tabTrigger: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#3b82f6',
    fontWeight: 'semibold',
  },
  tabContent: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'semibold',
    marginBottom: 8,
    color: '#000',
  },
  bioText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestBadge: {
    marginBottom: 4,
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  personalityTrait: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(243, 244, 246, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    gap: 8,
  },
  traitText: {
    fontSize: 14,
    fontWeight: 'medium',
    color: '#000',
    textAlign: 'center',
  },
  activityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityLabel: {
    fontSize: 14,
    color: '#374151',
  },
  activityValue: {
    fontSize: 14,
    fontWeight: 'medium',
    color: '#000',
  },
  progressBar: {
    height: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    width: '48%',
  },
  statContent: {
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#000',
  },
  actionButtons: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: 400,
    alignSelf: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  primaryButton: {
    backgroundColor: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  likeButton: {
    backgroundColor: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'semibold',
    color: '#fff',
  },
})