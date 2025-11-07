/**
 * DetailedPetAnalytics - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/DetailedPetAnalytics.native.tsx
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

type TrustBadge = {
  readonly type: string
  readonly label: string
  readonly description: string
}

interface PetTrustProfile {
  readonly overallRating?: number
  readonly playdateCount?: number
  readonly responseRate?: number
  readonly responseTime?: string
  readonly totalReviews?: number
  readonly ratingBreakdown?: Record<number, number>
  readonly badges?: TrustBadge[]
}

interface PetSummary {
  readonly name: string
  readonly breed?: string
  readonly age?: number
  readonly gender?: string
  readonly personality?: string[]
  readonly interests?: string[]
  readonly trustProfile?: PetTrustProfile
}

export interface DetailedPetAnalyticsProps {
  readonly pet: PetSummary
  readonly trustProfile?: PetTrustProfile
  readonly compatibilityScore?: number
  readonly matchReasons?: string[]
}

export function DetailedPetAnalytics({
  pet,
  trustProfile,
  compatibilityScore,
  matchReasons,
}: DetailedPetAnalyticsProps) {
  const profile = trustProfile ?? pet.trustProfile ?? {}

  const stats = [
    {
      icon: '❤️',
      label: 'Overall Rating',
      value: profile.overallRating?.toFixed(1) ?? 'N/A',
      suffix: '/5.0',
    },
    {
      icon: '👥',
      label: 'Playdates',
      value: String(profile.playdateCount ?? 0),
      suffix: ' completed',
    },
    {
      icon: '⚡️',
      label: 'Response Rate',
      value: `${Math.round((profile.responseRate ?? 0) * 100)}%`,
    },
    {
      icon: '⏱️',
      label: 'Avg Response',
      value: profile.responseTime ?? 'N/A',
    },
  ]

  const personalityTraits = pet.personality ?? []
  const interests = pet.interests ?? []

  return (
    <View style={styles.container}>
      {compatibilityScore !== undefined && (
        <View style={[styles.card, styles.comparisonCard]}>
          <Text style={styles.cardTitle}>Compatibility Score</Text>
          <View style={styles.compatibilityRow}>
            <Text style={styles.compatibilityValue}>{compatibilityScore}%</Text>
            <View style={styles.badge}>{renderCompatibilityBadge(compatibilityScore)}</View>
          </View>
          <ProgressBar value={compatibilityScore} />
          {matchReasons && matchReasons.length > 0 && (
            <View style={styles.reasonList}>
              <Text style={styles.sectionLabel}>Why this match works:</Text>
              {matchReasons.map((reason, idx) => (
                <Text key={idx} style={styles.reasonItem}>
                  • {reason}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Social Stats</Text>
        <View style={styles.statGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <View style={styles.statTextBlock}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>
                  {stat.value}
                  {stat.suffix && <Text style={styles.statSuffix}>{stat.suffix}</Text>}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {profile.totalReviews && profile.totalReviews > 0 && profile.ratingBreakdown && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rating Distribution</Text>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = profile.ratingBreakdown?.[rating] ?? 0
            const percentage = profile.totalReviews
              ? Math.round((count / profile.totalReviews) * 100)
              : 0
            return (
              <View key={rating} style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>{rating}★</Text>
                <ProgressBar value={percentage} height={6} />
                <Text style={styles.ratingCount}>{count}</Text>
              </View>
            )
          })}
        </View>
      )}

      {(personalityTraits.length > 0 || interests.length > 0) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personality & Interests</Text>
          {personalityTraits.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={styles.sectionLabel}>Personality</Text>
              <View style={styles.tagList}>
                {personalityTraits.map((trait) => (
                  <View key={trait} style={styles.tagPill}>
                    <Text style={styles.tagText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {interests.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={styles.sectionLabel}>Interests</Text>
              <View style={styles.tagList}>
                {interests.map((interest) => (
                  <View key={interest} style={[styles.tagPill, styles.tagOutline]}>
                    <Text style={[styles.tagText, styles.tagOutlineText]}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {profile.badges && profile.badges.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trust Badges</Text>
          <View style={styles.badgeRow}>
            {profile.badges.slice(0, 4).map((badge) => (
              <View key={badge.type} style={styles.badgePill}>
                <Text style={styles.badgeTitle}>{badge.label}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About {pet.name}</Text>
        <Text style={styles.aboutText}>
          {[pet.breed, pet.age ? `${String(pet.age ?? '')} yrs` : undefined, pet.gender]
            .filter(Boolean)
            .join(' • ') || 'Details unavailable'}
        </Text>
      </View>
    </View>
  )
}

function renderCompatibilityBadge(score: number) {
  if (score >= 85) {
    return <Text style={styles.badgeText}>Perfect Match</Text>
  }
  if (score >= 70) {
    return <Text style={styles.badgeText}>Great Fit</Text>
  }
  if (score >= 55) {
    return <Text style={styles.badgeText}>Good Potential</Text>
  }
  return <Text style={styles.badgeText}>Worth Exploring</Text>
}

interface ProgressBarProps {
  readonly value: number
  readonly height?: number
}

function ProgressBar({ value, height = 10 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <View style={[styles.progressTrack, { height }]}>
      <View style={[styles.progressFill, { width: `${String(clamped ?? '')}%` }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  comparisonCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  compatibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compatibilityValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#2563eb',
  },
  badge: {
    backgroundColor: '#1d4ed8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#2563eb',
    height: '100%',
    borderRadius: 999,
  },
  reasonList: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  reasonItem: {
    fontSize: 13,
    color: '#374151',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexBasis: '48%',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    fontSize: 18,
  },
  statTextBlock: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#4b5563',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  statSuffix: {
    fontSize: 12,
    color: '#6b7280',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 44,
  },
  ratingCount: {
    width: 30,
    textAlign: 'right',
    color: '#4b5563',
  },
  tagSection: {
    gap: 6,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: '#e0e7ff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#1e3a8a',
    fontWeight: '600',
  },
  tagOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1e3a8a',
  },
  tagOutlineText: {
    color: '#1e3a8a',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgePill: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    flexBasis: '48%',
    gap: 4,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  badgeDescription: {
    fontSize: 12,
    color: '#78350f',
  },
  aboutText: {
    color: '#374151',
    fontSize: 14,
  },
})
