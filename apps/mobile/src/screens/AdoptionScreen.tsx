import { FeatureCard } from '@mobile/components/FeatureCard'
import { PullableContainer } from '@mobile/components/PullableContainer'
import { RouteErrorBoundary } from '@mobile/components/RouteErrorBoundary'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { ErrorScreen } from '@mobile/components/ErrorScreen'
import { OfflineIndicator } from '@mobile/components/OfflineIndicator'
import { samplePets } from '@mobile/data/mock-data'
import { useDomainSnapshots } from '@mobile/hooks/use-domain-snapshots'
import { useNetworkStatus } from '@mobile/hooks/use-network-status'
import { colors } from '@mobile/theme/colors'
import { getTranslations } from '@mobile/i18n/translations'
import { createLogger } from '@mobile/utils/logger'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const logger = createLogger('AdoptionScreen')

// Default language (can be made dynamic later)
const language = 'en'
const t = getTranslations(language)

function AdoptionScreenContent(): React.JSX.Element {
  const { data, isLoading, error, refetch } = useDomainSnapshots()
  const networkStatus = useNetworkStatus()
  const [retryCount, setRetryCount] = useState(0)
  const adoption = data.adoption
  const [primaryPet] = samplePets

  const handleRefresh = useCallback(async (): Promise<void> => {
    try {
      await refetch()
      setRetryCount(0)
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (refreshError) {
      logger.warn('AdoptionScreen refresh failed', {
        error: refreshError instanceof Error ? refreshError.message : String(refreshError),
        retryCount,
      })
      setRetryCount(prev => prev + 1)
    }
  }, [refetch, retryCount])

  const handleRetry = useCallback((): void => {
    // Handle retry asynchronously without returning promise
    handleRefresh().catch((retryError) => {
      logger.warn('AdoptionScreen retry failed', {
        error: retryError instanceof Error ? retryError.message : String(retryError),
      })
    })
  }, [handleRefresh])

  // Show error screen if error and no valid data
  if (error && !adoption.canEditActiveListing && !isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ErrorScreen error={error} onRetry={handleRetry} />
      </SafeAreaView>
    )
  }

  // Show loading state only on initial load
  if (isLoading && !adoption.canEditActiveListing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <Text style={styles.bodyText}>{t.common.loading}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!primaryPet) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <Text style={styles.bodyText} accessible accessibilityLabel={t.adoption.noData}>
            {t.adoption.noData}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
      accessible
      accessibilityLabel={t.adoption.title}
    >
      <PullableContainer onRefresh={handleRefresh}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          accessible
          accessibilityLabel={`${t.adoption.title}. ${t.adoption.description}`}
        >
          {!networkStatus.isConnected && (
            <OfflineIndicator />
          )}

          <SectionHeader title={t.adoption.title} description={t.adoption.description} />

          <FeatureCard
            title={`${t.home.adoption.title}: ${primaryPet.name}`}
            subtitle={`${primaryPet.location.city}, ${primaryPet.location.country}`}
            accessible
            accessibilityLabel={`${t.home.adoption.title}: ${primaryPet.name}. ${primaryPet.location.city}, ${primaryPet.location.country}`}
            accessibilityRole="summary"
            accessibilityHint="Adoption listing details and status"
          >
            <Text
              style={styles.bodyText}
              accessible
              accessibilityLabel={`${t.adoption.listing.status} active`}
            >
              {t.adoption.listing.status}
            </Text>
            <Text
              style={styles.bodyText}
              accessible
              accessibilityLabel={`${t.adoption.listing.ownerCanEdit} ${adoption.canEditActiveListing ? t.common.yes : t.common.no}`}
            >
              {t.adoption.listing.ownerCanEdit} {adoption.canEditActiveListing ? t.common.yes : t.common.no}
            </Text>
            <Text
              style={styles.bodyText}
              accessible
              accessibilityLabel={`${t.adoption.listing.applicationsAccepted} ${adoption.canReceiveApplications ? t.common.yes : t.common.no}`}
            >
              {t.adoption.listing.applicationsAccepted} {adoption.canReceiveApplications ? t.common.yes : t.common.no}
            </Text>
          </FeatureCard>

          <FeatureCard
            title={t.adoption.transitions.listing}
            accessible
            accessibilityLabel={t.adoption.transitions.listing}
            accessibilityRole="summary"
            accessibilityHint="Listing status transition rules"
          >
            {adoption.statusTransitions.map((item: { status: string; allowed: boolean }) => (
              <View key={item.status} style={styles.row} accessible={false}>
                <Text
                  style={styles.label}
                  accessible
                  accessibilityLabel={`${item.status} transition`}
                >
                  {item.status}
                </Text>
                <Text
                  style={[styles.value, item.allowed ? styles.success : styles.blocked]}
                  accessible
                  accessibilityLabel={`${item.allowed ? t.adoption.transitions.permitted : t.adoption.transitions.blocked}`}
                >
                  {item.allowed ? t.adoption.transitions.permitted : t.adoption.transitions.blocked}
                </Text>
              </View>
            ))}
          </FeatureCard>

          <FeatureCard
            title={t.adoption.transitions.application}
            accessible
            accessibilityLabel={t.adoption.transitions.application}
            accessibilityRole="summary"
            accessibilityHint="Application workflow transition rules"
          >
            {adoption.applicationTransitions.map((item: { status: string; allowed: boolean }) => (
              <View key={item.status} style={styles.row} accessible={false}>
                <Text
                  style={styles.label}
                  accessible
                  accessibilityLabel={`${item.status} transition`}
                >
                  {item.status}
                </Text>
                <Text
                  style={[styles.value, item.allowed ? styles.success : styles.blocked]}
                  accessible
                  accessibilityLabel={`${item.allowed ? t.adoption.transitions.permitted : t.adoption.transitions.blocked}`}
                >
                  {item.allowed ? t.adoption.transitions.permitted : t.adoption.transitions.blocked}
                </Text>
              </View>
            ))}
          </FeatureCard>
        </ScrollView>
      </PullableContainer>
    </SafeAreaView>
  )
}

export function AdoptionScreen(): React.JSX.Element {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.warn('AdoptionScreen error', {
          error: error instanceof Error ? error.message : String(error),
        })
      }}
    >
      <AdoptionScreenContent />
    </RouteErrorBoundary>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  value: {
    textTransform: 'uppercase',
    fontSize: 12,
  },
  success: {
    color: colors.success,
  },
  blocked: {
    color: colors.danger,
  },
})
