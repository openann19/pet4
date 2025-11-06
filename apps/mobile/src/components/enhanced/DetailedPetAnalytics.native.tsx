import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { MotionView } from '@petspark/motion'
import { useStaggeredItem } from '@/effects/reanimated/use-staggered-item'
import { TrendUp, Heart, Users, Clock, Star, Lightning } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { Pet, PetTrustProfile } from '@/lib/types'

interface DetailedPetAnalyticsProps {
  pet: Pet
  trustProfile?: PetTrustProfile
  compatibilityScore?: number
  matchReasons?: string[]
}

export function DetailedPetAnalytics({
  pet,
  trustProfile,
  compatibilityScore,
  matchReasons
}: DetailedPetAnalyticsProps) {
  const stats = [
    {
      icon: Heart,
      label: 'Overall Rating',
      value: trustProfile?.overallRating?.toFixed(1) || 'N/A',
      max: '5.0',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20'
    },
    {
      icon: Users,
      label: 'Playdates',
      value: trustProfile?.playdateCount || 0,
      suffix: ' completed',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      borderColor: 'border-secondary/20'
    },
    {
      icon: Lightning,
      label: 'Response Rate',
      value: `${Math.round((trustProfile?.responseRate || 0) * 100)}%`,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/20'
    },
    {
      icon: Clock,
      label: 'Avg Response',
      value: trustProfile?.responseTime || 'N/A',
      color: 'text-lavender',
      bgColor: 'bg-lavender/10',
      borderColor: 'border-lavender/20'
    }
  ]

  const personalityTraits = pet.personality || []
  const interests = pet.interests || []

  return (
    <View style={styles.container}>
      {compatibilityScore !== undefined && (
        <AnimatedCard delay={0}>
          <Card style={styles.compatibilityCard}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <TrendUp size={24} color="#3b82f6" weight="duotone" />
                <Text style={styles.titleText}>Compatibility Score</Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                  {compatibilityScore}%
                </Text>
                <Badge
                  variant={compatibilityScore >= 85 ? 'default' : compatibilityScore >= 70 ? 'secondary' : 'outline'}
                  style={styles.scoreBadge}
                >
                  {compatibilityScore >= 85 ? 'Perfect Match' :
                   compatibilityScore >= 70 ? 'Great Fit' :
                   compatibilityScore >= 55 ? 'Good Potential' : 'Worth Exploring'}
                </Badge>
              </View>
              <Progress value={compatibilityScore} style={styles.progress} />

              {matchReasons && matchReasons.length > 0 && (
                <View style={styles.reasonsContainer}>
                  <Text style={styles.reasonsTitle}>Why this match works:</Text>
                  {matchReasons.map((reason, idx) => (
                    <AnimatedListItem key={idx} index={idx}>
                      <View style={styles.reasonItem}>
                        <Star size={16} color="#f59e0b" weight="fill" />
                        <Text style={styles.reasonText}>{reason}</Text>
                      </View>
                    </AnimatedListItem>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
      )}

      <AnimatedCard delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>Social Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.statsGrid}>
              {stats.map((stat, idx) => (
                <AnimatedStatCard key={idx} index={idx}>
                  <View style={[styles.statCard, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
                    <View style={styles.statIcon}>
                      <stat.icon size={24} color="#3b82f6" weight="duotone" />
                    </View>
                    <View style={styles.statContent}>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                      <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                        {stat.value}
                        {stat.suffix && <Text style={styles.statSuffix}>{stat.suffix}</Text>}
                      </Text>
                    </View>
                  </View>
                </AnimatedStatCard>
              ))}
            </View>
          </CardContent>
        </Card>
      </AnimatedCard>

      {trustProfile && trustProfile.totalReviews > 0 && (
        <AnimatedCard delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = trustProfile.ratingBreakdown?.[rating as keyof typeof trustProfile.ratingBreakdown] || 0
                const percentage = trustProfile.totalReviews > 0
                  ? (count / trustProfile.totalReviews) * 100
                  : 0

                return (
                  <View key={rating} style={styles.ratingRow}>
                    <View style={styles.ratingLabel}>
                      <Text style={styles.ratingNumber}>{rating}</Text>
                      <Star size={14} color="#f59e0b" weight="fill" />
                    </View>
                    <View style={styles.ratingBar}>
                      <Progress value={percentage} style={styles.ratingProgress} />
                    </View>
                    <Text style={styles.ratingCount}>{count}</Text>
                  </View>
                )
              })}
            </CardContent>
          </Card>
        </AnimatedCard>
      )}

      <AnimatedCard delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle>Personality & Interests</CardTitle>
          </CardHeader>
          <CardContent>
            {personalityTraits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personality</Text>
                <View style={styles.tagsContainer}>
                  {personalityTraits.map((trait, idx) => (
                    <AnimatedBadge key={idx} index={idx}>
                      <Badge variant="secondary" style={styles.tag}>
                        {trait}
                      </Badge>
                    </AnimatedBadge>
                  ))}
                </View>
              </View>
            )}

            {interests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.tagsContainer}>
                  {interests.map((interest, idx) => (
                    <AnimatedBadge key={idx} index={idx}>
                      <Badge variant="outline" style={styles.tag}>
                        {interest}
                      </Badge>
                    </AnimatedBadge>
                  ))}
                </View>
              </View>
            )}
          </CardContent>
        </Card>
      </AnimatedCard>
    </View>
  )
}

function AnimatedCard({ delay, children }: { delay: number; children: React.ReactNode }) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 })
    translateY.value = withTiming(0, { duration: 400 })
  }, [opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return <MotionView animatedStyle={animatedStyle}>{children}</MotionView>
}

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useSharedValue(0)
  const translateX = useSharedValue(-10)

  useEffect(() => {
    const delay = index * 100
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 })
      translateX.value = withTiming(0, { duration: 300 })
    }, delay)
  }, [index, opacity, translateX])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }))

  return <MotionView animatedStyle={animatedStyle}>{children}</MotionView>
}

function AnimatedStatCard({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.9)

  useEffect(() => {
    const delay = index * 50
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 })
      scale.value = withTiming(1, { duration: 300 })
    }, delay)
  }, [index, opacity, scale])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  return <MotionView animatedStyle={animatedStyle}>{children}</MotionView>
}

function AnimatedBadge({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)

  useEffect(() => {
    const delay = index * 50
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 })
      scale.value = withTiming(1, { duration: 300 })
    }, delay)
  }, [index, opacity, scale])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  return <MotionView animatedStyle={animatedStyle}>{children}</MotionView>
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  compatibilityCard: {
    borderColor: 'rgba(59, 130, 246, 0.2)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    backgroundColor: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
    backgroundClip: 'text',
    color: 'transparent',
  },
  scoreBadge: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  progress: {
    height: 12,
  },
  reasonsContainer: {
    marginTop: 16,
    gap: 8,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  reasonText: {
    fontSize: 14,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
  },
  statIcon: {
    padding: 8,
    borderRadius: 8,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statSuffix: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  ratingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 32,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingBar: {
    flex: 1,
  },
  ratingProgress: {
    height: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    width: 24,
    textAlign: 'right',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    fontSize: 14,
  },
})
