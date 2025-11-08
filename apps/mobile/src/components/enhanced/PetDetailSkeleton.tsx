/**
 * PetDetailSkeleton - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/PetDetailSkeleton.tsx
 *
 * Skeleton loader for pet detail view
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SmartSkeleton } from './SmartSkeleton'

export function PetDetailSkeleton(): React.JSX.Element {
  return (
    <View style={styles.container}>
      {/* Photo Gallery Skeleton */}
      <View style={styles.photoContainer}>
        <SmartSkeleton variant="rectangular" width="100%" height={384} style={styles.photo} />
        <View style={styles.photoIndicators}>
          {[1, 2, 3].map(i => (
            <SmartSkeleton
              key={i}
              variant="circular"
              width={8}
              height={8}
              style={styles.indicator}
            />
          ))}
        </View>
      </View>

      {/* Header Skeleton */}
      <View style={styles.header}>
        <SmartSkeleton variant="text" width={192} height={32} style={styles.title} />
        <SmartSkeleton variant="text" width={128} height={16} style={styles.subtitle} />
        <SmartSkeleton variant="text" width={160} height={16} style={styles.subtitle} />
      </View>

      {/* Match Reasons Skeleton */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>
            <SmartSkeleton variant="text" width={160} height={24} />
          </CardTitle>
        </CardHeader>
        <CardContent style={styles.matchContent}>
          <SmartSkeleton variant="text" width="100%" height={16} />
          <SmartSkeleton variant="text" width="75%" height={16} />
          <SmartSkeleton variant="text" width="83%" height={16} />
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <SmartSkeleton variant="rectangular" width={96} height={40} style={styles.tab} />
          <SmartSkeleton variant="rectangular" width={128} height={40} style={styles.tab} />
          <SmartSkeleton variant="rectangular" width={96} height={40} style={styles.tab} />
        </View>
        <View style={styles.tabContent}>
          <SmartSkeleton variant="text" width="100%" height={16} />
          <SmartSkeleton variant="text" width="83%" height={16} />
          <SmartSkeleton variant="text" width="80%" height={16} />
        </View>
      </View>

      {/* Action Buttons Skeleton */}
      <View style={styles.actions}>
        <SmartSkeleton variant="rectangular" width="100%" height={48} style={styles.actionButton} />
        <SmartSkeleton variant="rectangular" width="100%" height={48} style={styles.actionButton} />
        <SmartSkeleton variant="rectangular" width="100%" height={48} style={styles.actionButton} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    padding: 16,
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  photo: {
    borderRadius: 12,
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: [{ translateX: -24 }],
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    borderRadius: 4,
  },
  header: {
    gap: 8,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 4,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  matchContent: {
    gap: 8,
  },
  tabsContainer: {
    gap: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  tab: {
    borderRadius: 8,
  },
  tabContent: {
    gap: 16,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 24,
  },
})
