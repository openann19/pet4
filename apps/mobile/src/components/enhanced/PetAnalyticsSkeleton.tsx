/**
 * PetAnalyticsSkeleton - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/PetAnalyticsSkeleton.tsx
 *
 * Skeleton loader for pet analytics view
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SmartSkeleton } from './SmartSkeleton'

export function PetAnalyticsSkeleton(): React.JSX.Element {
  return (
    <View style={styles.container}>
      {/* Compatibility Score Skeleton */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>
            <SmartSkeleton variant="text" width={192} height={24} />
          </CardTitle>
        </CardHeader>
        <CardContent style={styles.cardContent}>
          <View style={styles.scoreRow}>
            <SmartSkeleton variant="rectangular" width={128} height={64} />
            <SmartSkeleton variant="rectangular" width={128} height={32} />
          </View>
          <SmartSkeleton variant="rectangular" width="100%" height={12} />
        </CardContent>
      </Card>

      {/* Social Stats Skeleton */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>
            <SmartSkeleton variant="text" width={128} height={24} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.statsGrid}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={styles.statItem}>
                <SmartSkeleton variant="circular" width={48} height={48} />
                <View style={styles.statText}>
                  <SmartSkeleton variant="text" width={80} height={12} />
                  <SmartSkeleton variant="text" width={64} height={24} />
                </View>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* Rating Distribution Skeleton */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>
            <SmartSkeleton variant="text" width={160} height={24} />
          </CardTitle>
        </CardHeader>
        <CardContent style={styles.ratingContent}>
          {[5, 4, 3, 2, 1].map(rating => (
            <View key={rating} style={styles.ratingRow}>
              <SmartSkeleton variant="text" width={64} height={16} />
              <SmartSkeleton
                variant="rectangular"
                width="100%"
                height={8}
                style={styles.ratingBar}
              />
              <SmartSkeleton variant="text" width={48} height={16} />
            </View>
          ))}
        </CardContent>
      </Card>

      {/* Personality & Interests Skeleton */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>
            <SmartSkeleton variant="text" width={192} height={24} />
          </CardTitle>
        </CardHeader>
        <CardContent style={styles.traitsContent}>
          <View style={styles.traitSection}>
            <SmartSkeleton variant="text" width={96} height={16} style={styles.traitLabel} />
            <View style={styles.chipsRow}>
              {[1, 2, 3, 4].map(i => (
                <SmartSkeleton
                  key={i}
                  variant="rectangular"
                  width={80}
                  height={24}
                  style={styles.chip}
                />
              ))}
            </View>
          </View>
          <View style={styles.traitSection}>
            <SmartSkeleton variant="text" width={96} height={16} style={styles.traitLabel} />
            <View style={styles.chipsRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <SmartSkeleton
                  key={i}
                  variant="rectangular"
                  width={96}
                  height={24}
                  style={styles.chip}
                />
              ))}
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardContent: {
    gap: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    width: '48%',
  },
  statText: {
    flex: 1,
    gap: 8,
  },
  ratingContent: {
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingBar: {
    flex: 1,
    borderRadius: 4,
  },
  traitsContent: {
    gap: 16,
  },
  traitSection: {
    gap: 8,
  },
  traitLabel: {
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 12,
  },
})
