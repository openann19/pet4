/**
 * HomeScreen Component
 *
 * First screen in main tab navigation (feed tab). Displays domain snapshots
 * for adoption, community, and matching features.
 *
 * Features:
 * - Pull-to-refresh support
 * - Domain snapshot display
 * - Error handling with retry
 * - Loading states
 * - Offline handling
 * - Accessibility support
 * - Animations
 * - i18n support
 *
 * @example
 * <HomeScreen />
 */
import React, { useCallback, useState } from 'react'

import { FeatureCard } from '@mobile/components/FeatureCard'
import { PullableContainer } from '@mobile/components/PullableContainer'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { ErrorScreen } from '@mobile/components/ErrorScreen'
import { LoadingIndicator } from '@mobile/components/LoadingIndicator'
import { OfflineIndicator } from '@mobile/components/OfflineIndicator'
import { RouteErrorBoundary } from '@mobile/components/RouteErrorBoundary'
import { useDomainSnapshots } from '@mobile/hooks/use-domain-snapshots'
import { useNetworkStatus } from '@mobile/hooks/use-network-status'
import { colors } from '@mobile/theme/colors'
import { getTranslations } from '@mobile/i18n/translations'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Animated, FadeIn, FadeInDown } from '@petspark/motion'
import { createLogger } from '@mobile/utils/logger'

const logger = createLogger('HomeScreen')

// Default language (can be made dynamic later)
const language = 'en'
const t = getTranslations(language)

/**
 * Validate domain snapshots data structure
 * Returns true if data is valid, false otherwise
 */
function validateDomainSnapshots(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    return false
  }

  const snapshots = data as Record<string, unknown>

  // Validate adoption
  if (
    !snapshots.adoption ||
    typeof snapshots.adoption !== 'object' ||
    typeof (snapshots.adoption as Record<string, unknown>).canEditActiveListing !== 'boolean' ||
    typeof (snapshots.adoption as Record<string, unknown>).canReceiveApplications !== 'boolean'
  ) {
    return false
  }

  // Validate community
  if (
    !snapshots.community ||
    typeof snapshots.community !== 'object' ||
    typeof (snapshots.community as Record<string, unknown>).canEditPendingPost !== 'boolean' ||
    typeof (snapshots.community as Record<string, unknown>).canReceiveCommentsOnActivePost !== 'boolean'
  ) {
    return false
  }

  // Validate matching
  if (
    !snapshots.matching ||
    typeof snapshots.matching !== 'object' ||
    typeof (snapshots.matching as Record<string, unknown>).hardGatesPassed !== 'boolean' ||
    !(snapshots.matching as Record<string, unknown>).score ||
    typeof ((snapshots.matching as Record<string, unknown>).score as Record<string, unknown>).totalScore !== 'number'
  ) {
    return false
  }

  return true
}

function HomeScreenContent(): React.JSX.Element {
  const { data: snapshots, isLoading, error, refetch } = useDomainSnapshots()
  const networkStatus = useNetworkStatus()
  const [retryCount, setRetryCount] = useState(0)

  // Validate snapshots data
  const isValidData = validateDomainSnapshots(snapshots)

  // Handle refresh with error handling
  const handleRefresh = useCallback(async (): Promise<void> => {
    try {
      await refetch()
      setRetryCount(0)
    } catch (refreshError) {
      logger.warn('Refresh failed', {
        error: refreshError instanceof Error ? refreshError.message : String(refreshError),
        retryCount,
      })
      setRetryCount(prev => prev + 1)
    }
  }, [refetch, retryCount])

  // Handle retry
  const handleRetry = useCallback((): void => {
    // Handle retry asynchronously without returning promise
    handleRefresh().catch((retryError) => {
      logger.warn('HomeScreen retry failed', {
        error: retryError instanceof Error ? retryError.message : String(retryError),
      })
    })
  }, [handleRefresh])

  // Show error screen if error and no valid data
  if (error && !isValidData && !isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ErrorScreen error={error} onRetry={handleRetry} />
      </SafeAreaView>
    )
  }

  // Show loading state only on initial load
  if (isLoading && !snapshots.adoption) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <LoadingIndicator message={t.common.loading} />
      </SafeAreaView>
    )
  }

  // Use snapshots data (defaults are already applied in hook if needed)
  const displaySnapshots = snapshots

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <PullableContainer onRefresh={handleRefresh}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          accessible
          accessibilityLabel={t.home.title}
        >
          {!networkStatus.isConnected && (
            <Animated.View entering={FadeIn.duration(300)}>
              <OfflineIndicator />
            </Animated.View>
          )}

          <Animated.View entering={FadeIn.duration(300)}>
            <SectionHeader
              title={t.home.title}
              description={t.home.description}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <FeatureCard
              title={t.home.adoption.title}
              subtitle={t.home.adoption.subtitle}
              accessible
              accessibilityLabel={`${t.home.adoption.title}. ${t.home.adoption.subtitle}`}
              accessibilityRole="summary"
              accessibilityHint="Adoption marketplace governance and workflows"
            >
              <Text
                style={styles.bodyText}
                accessible
                accessibilityLabel={`${t.home.adoption.canEditActiveListing} ${displaySnapshots.adoption.canEditActiveListing ? t.common.yes : t.common.no}`}
              >
                {t.home.adoption.canEditActiveListing}{' '}
                {displaySnapshots.adoption.canEditActiveListing ? t.common.yes : t.common.no}
              </Text>
              <Text
                style={styles.bodyText}
                accessible
                accessibilityLabel={`${t.home.adoption.acceptingApplications} ${displaySnapshots.adoption.canReceiveApplications ? t.common.enabled : t.common.paused}`}
              >
                {t.home.adoption.acceptingApplications}{' '}
                {displaySnapshots.adoption.canReceiveApplications ? t.common.enabled : t.common.paused}
              </Text>
            </FeatureCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <FeatureCard
              title={t.home.community.title}
              subtitle={t.home.community.subtitle}
              accessible
              accessibilityLabel={`${t.home.community.title}. ${t.home.community.subtitle}`}
              accessibilityRole="summary"
              accessibilityHint="Community engagement guardrails"
            >
              <Text
                style={styles.bodyText}
                accessible
                accessibilityLabel={`${t.home.community.pendingPostsEditable} ${displaySnapshots.community.canEditPendingPost ? t.common.allowed : t.common.locked}`}
              >
                {t.home.community.pendingPostsEditable}{' '}
                {displaySnapshots.community.canEditPendingPost ? t.common.allowed : t.common.locked}
              </Text>
              <Text
                style={styles.bodyText}
                accessible
                accessibilityLabel={`${t.home.community.commentsOnLivePosts} ${displaySnapshots.community.canReceiveCommentsOnActivePost ? t.common.open : t.common.closed}`}
              >
                {t.home.community.commentsOnLivePosts}{' '}
                {displaySnapshots.community.canReceiveCommentsOnActivePost ? t.common.open : t.common.closed}
              </Text>
            </FeatureCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(300)}>
            <FeatureCard
              title={t.home.matching.title}
              subtitle={t.home.matching.subtitle}
              accessible
              accessibilityLabel={`${t.home.matching.title}. ${t.home.matching.subtitle}`}
              accessibilityRole="summary"
              accessibilityHint="Signal-driven pairing and matching"
            >
              <Text
                style={styles.bodyText}
                accessible
                accessibilityLabel={`${t.home.matching.hardGates} ${displaySnapshots.matching.hardGatesPassed ? t.common.allClear : t.common.requiresReview}`}
              >
                {t.home.matching.hardGates}{' '}
                {displaySnapshots.matching.hardGatesPassed ? t.common.allClear : t.common.requiresReview}
              </Text>
              <Text
                style={styles.bodyText}
                accessible
                accessibilityLabel={`${t.home.matching.weightedScore} ${Number(displaySnapshots.matching.score.totalScore).toFixed(1)} / 100`}
              >
                {t.home.matching.weightedScore} {Number(displaySnapshots.matching.score.totalScore).toFixed(1)} / 100
              </Text>
            </FeatureCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(300)}>
            <View
              style={styles.footer}
              accessible
              accessibilityRole="text"
              accessibilityLabel="Navigation information"
              accessibilityHint={t.home.footer}
            >
              <Text style={styles.footerText}>{t.home.footer}</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </PullableContainer>
    </SafeAreaView>
  )
}

export function HomeScreen(): React.JSX.Element {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.warn('HomeScreen error', {
          error: error instanceof Error ? error.message : String(error),
        })
      }}
    >
      <HomeScreenContent />
    </RouteErrorBoundary>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 28 },
  bodyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  footer: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: colors.surface },
  footerText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
})
