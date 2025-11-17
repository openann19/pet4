import { useEffect } from 'react';
import React from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, animate } from '@petspark/motion';
import { MotionView } from '@petspark/motion';
import { TrendUp, Heart, Users, Clock, Star, Lightning } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Pet, PetTrustProfile } from '@/lib/types';
import { useUIConfig } from "@/hooks/use-ui-config";
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { cn } from '@/lib/utils';

interface DetailedPetAnalyticsProps {
  pet: Pet;
  trustProfile?: PetTrustProfile;
  compatibilityScore?: number;
  matchReasons?: string[];
}

export function DetailedPetAnalytics({
  pet,
  trustProfile,
  compatibilityScore,
  matchReasons,
}: DetailedPetAnalyticsProps) {
    const _uiConfig = useUIConfig();
    const prefersReducedMotion = usePrefersReducedMotion();
    const stats = [
        {
          icon: Heart,
          label: 'Overall Rating',
          value: trustProfile?.overallRating?.toFixed(1) ?? 'N/A',
          max: '5.0',
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
        },
        {
          icon: Users,
          label: 'Playdates',
          value: trustProfile?.playdateCount ?? 0,
          suffix: ' completed',
          color: 'text-secondary',
          bgColor: 'bg-secondary/10',
          borderColor: 'border-secondary/20',
        },
        {
          icon: Lightning,
          label: 'Response Rate',
          value: `${Math.round((trustProfile?.responseRate ?? 0) * 100)}%`,
          color: 'text-accent',
          bgColor: 'bg-accent/10',
          borderColor: 'border-accent/20',
        },
        {
          icon: Clock,
          label: 'Avg Response',
          value: trustProfile?.responseTime ?? 'N/A',
          color: 'text-lavender',
          bgColor: 'bg-lavender/10',
          borderColor: 'border-lavender/20',
        },
      ];

  const personalityTraits = pet.personality ?? [];
  const interests = pet.interests ?? [];

  return (
    <section aria-label="Pet analytics" className={getSpacingClassesFromConfig({ spaceY: 'xl' })}>
      {compatibilityScore !== undefined && (
        <AnimatedCard prefersReducedMotion={prefersReducedMotion}>
          <Card className="border-primary/20 bg-linear-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className={cn('flex items-center', getSpacingClassesFromConfig({ gap: 'sm' }))}>
                <TrendUp size={24} className="text-primary" weight="duotone" aria-hidden="true" />
                Compatibility Score
              </CardTitle>
            </CardHeader>
            <CardContent className={getSpacingClassesFromConfig({ spaceY: 'lg' })}>
              <div className={cn('flex items-center justify-between', getSpacingClassesFromConfig({ gap: 'md' }))}>
                <span className={cn('bg-linear-to-r from-primary to-accent bg-clip-text text-transparent', getTypographyClasses('display'))}>
                  {compatibilityScore}%
                </span>
                <Badge
                  variant={
                    compatibilityScore >= 85
                      ? 'default'
                      : compatibilityScore >= 70
                        ? 'secondary'
                        : 'outline'
                  }
                  className={cn(getTypographyClasses('caption'), getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'xs' }))}
                >
                  {compatibilityScore >= 85
                    ? 'Perfect Match'
                    : compatibilityScore >= 70
                      ? 'Great Fit'
                      : compatibilityScore >= 55
                        ? 'Good Potential'
                        : 'Worth Exploring'}
                </Badge>
              </div>
              <Progress value={compatibilityScore} className="h-3" aria-label={`Compatibility score: ${compatibilityScore}%`} />

              {matchReasons && matchReasons.length > 0 && (
                <div className={cn(getSpacingClassesFromConfig({ spaceY: 'sm', marginY: 'lg' }))}>
                  <p className={cn(getTypographyClasses('caption'), 'text-muted-foreground font-semibold')}>
                    Why this match works:
                  </p>
                  <ul role="list" className={getSpacingClassesFromConfig({ spaceY: 'xs' })}>
                    {matchReasons.map((reason, idx) => (
                      <AnimatedListItem key={idx} index={idx}>
                        <li role="listitem" className={cn('flex items-start', getSpacingClassesFromConfig({ gap: 'sm' }))}>
                          <Star size={16} className={cn('text-accent mt-0.5 shrink-0', getTypographyClasses('caption'))} weight="fill" aria-hidden="true" />
                          <span className={getTypographyClasses('body-sm')}>{reason}</span>
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
            <div className={cn('grid grid-cols-2', getSpacingClassesFromConfig({ gap: 'lg' }))}>
              {stats.map((stat, idx) => (
                <AnimatedStatCard key={idx} index={idx}>
                  <div
                    className={cn(
                      'flex items-center rounded-xl border',
                      getSpacingClassesFromConfig({ gap: 'md', padding: 'lg' }),
                      stat.bgColor,
                      stat.borderColor
                    )}
                    role="group"
                    aria-label={`${stat.label}: ${stat.value}${stat.suffix || ''}`}
                  >
                    <div className={cn('rounded-lg', getSpacingClassesFromConfig({ padding: 'sm' }), stat.bgColor)}>
                      <stat.icon size={24} className={stat.color} weight="duotone" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(getTypographyClasses('caption'), 'text-muted-foreground truncate')}>{stat.label}</p>
                      <p className={cn(getTypographyClasses('body'), stat.color, 'truncate')}>
                        {stat.value}
                        {stat.suffix && <span className={cn(getTypographyClasses('caption'), 'font-normal')}>{stat.suffix}</span>}
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
            <CardContent className={getSpacingClassesFromConfig({ spaceY: 'md' })}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count =
                  trustProfile.ratingBreakdown?.[
                    rating as keyof typeof trustProfile.ratingBreakdown
                  ] ?? 0;
                const percentage =
                  trustProfile.totalReviews > 0 ? (count / trustProfile.totalReviews) * 100 : 0;

                return (
                  <div key={rating} className={cn('flex items-center', getSpacingClassesFromConfig({ gap: 'md' }))} role="group" aria-label={`${rating} star rating: ${count} reviews`}>
                    <div className={cn('flex items-center w-16', getSpacingClassesFromConfig({ gap: 'xs' }))}>
                      <span className={cn(getTypographyClasses('caption'), 'font-medium')}>{rating}</span>
                      <Star size={14} className="text-accent" weight="fill" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2" aria-label={`${percentage.toFixed(0)}% of reviews are ${rating} stars`} />
                    </div>
                    <span className={cn(getTypographyClasses('caption'), 'text-muted-foreground w-12 text-right')}>{count}</span>
                  </div>
                );
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
          <CardContent className={getSpacingClassesFromConfig({ spaceY: 'lg' })}>
            {personalityTraits.length > 0 && (
              <div>
                <p className={cn(getTypographyClasses('caption'), 'text-muted-foreground font-semibold', getSpacingClassesFromConfig({ marginY: 'sm' }))}>Personality</p>
                <ul role="list" className={cn('flex flex-wrap', getSpacingClassesFromConfig({ gap: 'sm' }))}>
                  {personalityTraits.map((trait, idx) => (
                    <AnimatedBadge key={idx} index={idx}>
                      <li role="listitem">
                        <Badge variant="secondary" className={getTypographyClasses('caption')}>
                          {trait}
                        </Badge>
                      </li>
                    </AnimatedBadge>
                  ))}
                </ul>
              </div>
            )}

            {interests.length > 0 && (
              <div>
                <p className={cn(getTypographyClasses('caption'), 'text-muted-foreground font-semibold', getSpacingClassesFromConfig({ marginY: 'sm' }))}>Interests</p>
                <ul role="list" className={cn('flex flex-wrap', getSpacingClassesFromConfig({ gap: 'sm' }))}>
                  {interests.map((interest, idx) => (
                    <AnimatedBadge key={idx} index={idx}>
                      <li role="listitem">
                        <Badge variant="outline" className={getTypographyClasses('caption')}>
                          {interest}
                        </Badge>
                      </li>
                    </AnimatedBadge>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedCard>
    </section>
  );
}

function AnimatedCard({ children, prefersReducedMotion = false }: { children: React.ReactNode; prefersReducedMotion?: boolean }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (prefersReducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const opacityTransition = withTiming(1, { duration: 400 });
    animate(opacity, opacityTransition.target, opacityTransition.transition);
    const translateYTransition = withTiming(0, { duration: 400 });
    animate(translateY, translateYTransition.target, translateYTransition.transition);
  }, [opacity, translateY, prefersReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: translateY.get() }],
  }));

  return <MotionView style={animatedStyle}>{children}</MotionView>;
}

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-10);

  useEffect(() => {
    const delay = index * 100;
    setTimeout(() => {
      const opacityTransition = withTiming(1, { duration: 300 });
      animate(opacity, opacityTransition.target, opacityTransition.transition);
      const translateXTransition = withTiming(0, { duration: 300 });
      animate(translateX, translateXTransition.target, translateXTransition.transition);
    }, delay);
  }, [index, opacity, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateX: translateX.get() }],
  }));

  return <MotionView style={animatedStyle}>{children}</MotionView>;
}

function AnimatedStatCard({ index, children, prefersReducedMotion = false }: { index: number; children: React.ReactNode; prefersReducedMotion?: boolean }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (prefersReducedMotion) {
      opacity.value = 1;
      scale.value = 1;
      return;
    }
    const delay = index * 50;
    setTimeout(() => {
      const opacityTransition = withTiming(1, { duration: 300 });
      animate(opacity, opacityTransition.target, opacityTransition.transition);
      const scaleTransition = withTiming(1, { duration: 300 });
      animate(scale, scaleTransition.target, scaleTransition.transition);
    }, delay);
  }, [index, opacity, scale, prefersReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }));

  return <MotionView style={animatedStyle}>{children}</MotionView>;
}

function AnimatedBadge({ index, children, prefersReducedMotion = false }: { index: number; children: React.ReactNode; prefersReducedMotion?: boolean }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (prefersReducedMotion) {
      opacity.value = 1;
      scale.value = 1;
      return;
    }
    const delay = index * 50;
    setTimeout(() => {
      const opacityTransition = withTiming(1, { duration: 300 });
      animate(opacity, opacityTransition.target, opacityTransition.transition);
      const scaleTransition = withTiming(1, { duration: 300 });
      animate(scale, scaleTransition.target, scaleTransition.transition);
    }, delay);
  }, [index, opacity, scale, prefersReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ scale: scale.get() }],
  }));

  return <MotionView style={animatedStyle}>{children}</MotionView>;
}
