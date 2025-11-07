import { useEffect } from 'react'
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { MotionView } from '@petspark/motion'
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
      value: `${String(Math.round((trustProfile?.responseRate || 0) * 100) ?? '')}%`,
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
    <div className="space-y-6">
      {compatibilityScore !== undefined && (
        <AnimatedCard>
          <Card className="border-primary/20 bg-linear-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendUp size={24} className="text-primary" weight="duotone" />
                Compatibility Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-5xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                  {compatibilityScore}%
                </span>
                <Badge 
                  variant={compatibilityScore >= 85 ? 'default' : compatibilityScore >= 70 ? 'secondary' : 'outline'}
                  className="text-sm px-3 py-1"
                >
                  {compatibilityScore >= 85 ? 'Perfect Match' : 
                   compatibilityScore >= 70 ? 'Great Fit' : 
                   compatibilityScore >= 55 ? 'Good Potential' : 'Worth Exploring'}
                </Badge>
              </div>
              <Progress value={compatibilityScore} className="h-3" />
              
              {matchReasons && matchReasons.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-semibold text-muted-foreground">Why this match works:</p>
                  <ul className="space-y-1.5">
                    {matchReasons.map((reason, idx) => (
                      <AnimatedListItem key={idx} index={idx}>
                        <li className="flex items-start gap-2 text-sm">
                          <Star size={16} className="text-accent mt-0.5 shrink-0" weight="fill" />
                          <span>{reason}</span>
                        </li>
                      </AnimatedListItem>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>
      )}

      <AnimatedCard>
        <Card>
          <CardHeader>
            <CardTitle>Social Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, idx) => (
                <AnimatedStatCard key={idx} index={idx}>
                  <div className={`flex items-center gap-3 p-4 rounded-xl ${String(stat.bgColor ?? '')} border ${String(stat.borderColor ?? '')}`}>
                  <div className={`p-2 rounded-lg ${String(stat.bgColor ?? '')}`}>
                    <stat.icon size={24} className={stat.color} weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    <p className={`text-lg font-bold ${String(stat.color ?? '')} truncate`}>
                      {stat.value}
                      {stat.suffix && <span className="text-xs font-normal">{stat.suffix}</span>}
                    </p>
                  </div>
                </div>
                </AnimatedStatCard>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedCard>

      {trustProfile && trustProfile.totalReviews > 0 && (
        <AnimatedCard>
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = trustProfile.ratingBreakdown?.[rating as keyof typeof trustProfile.ratingBreakdown] || 0
                const percentage = trustProfile.totalReviews > 0 
                  ? (count / trustProfile.totalReviews) * 100 
                  : 0

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star size={14} className="text-accent" weight="fill" />
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {count}
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </AnimatedCard>
      )}

      <AnimatedCard>
        <Card>
          <CardHeader>
            <CardTitle>Personality & Interests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {personalityTraits.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Personality</p>
                <div className="flex flex-wrap gap-2">
                  {personalityTraits.map((trait, idx) => (
                    <AnimatedBadge key={idx} index={idx}>
                      <Badge variant="secondary" className="text-sm">
                        {trait}
                      </Badge>
                    </AnimatedBadge>
                  ))}
                </div>
              </div>
            )}

            {interests.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, idx) => (
                    <AnimatedBadge key={idx} index={idx}>
                      <Badge variant="outline" className="text-sm">
                        {interest}
                      </Badge>
                    </AnimatedBadge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedCard>
    </div>
  )
}

function AnimatedCard({ children }: { children: React.ReactNode }) {
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
