import { PullableContainer } from '@mobile/components/PullableContainer'
import { RouteErrorBoundary } from '@mobile/components/RouteErrorBoundary'
import { OfflineIndicator } from '@mobile/components/OfflineIndicator'
import { useNetworkStatus } from '@mobile/hooks/use-network-status'
import { MatchCelebration } from '@mobile/components/swipe/MatchCelebration'
import { SwipeCardStack } from '@mobile/components/swipe/SwipeCardStack'
import { useDislikePet, useLikePet, usePets } from '@mobile/hooks/use-pets'
import { useUserStore } from '@mobile/store/user-store'
import { getTranslations } from '@mobile/i18n/translations'
import { colors } from '@mobile/theme/colors'
import { createLogger } from '@mobile/utils/logger'
import React, { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Animated, FadeIn } from '@petspark/motion'
import type { ApiResponse } from '../types/api'
import type { Match } from '../types/pet'
import { isTruthy } from '@petspark/shared';

const logger = createLogger('MatchingScreen')

// Default language (can be made dynamic later)
const language = 'en'
const t = getTranslations(language)

function MatchingScreenContent(): React.JSX.Element {
  const [showMatch, setShowMatch] = useState(false)
  const [matchPetNames, setMatchPetNames] = useState<[string, string]>(['', ''])
  const { data, isLoading, error, refetch } = usePets()
  const likePet = useLikePet()
  const dislikePet = useDislikePet()
  const { user } = useUserStore()
  const networkStatus = useNetworkStatus()

  const handleRefresh = useCallback(async (): Promise<void> => {
    try {
      await refetch()
    } catch (refreshError) {
      logger.warn('MatchingScreen refresh failed', {
        error: refreshError instanceof Error ? refreshError : new Error(String(refreshError)),
      })
    }
  }, [refetch])

  const pets = useMemo(() => data?.items || [], [data?.items])

  const handleSwipeLeft = useCallback(
    (petId: string): void => {
      dislikePet.mutate(petId)
    },
    [dislikePet]
  )

  const handleSwipeRight = useCallback(
    (petId: string): void => {
      likePet.mutate(petId, {
        onSuccess: (response: ApiResponse<Match | null>) => {
          if (response.data && 'id' in response.data) {
            // Match occurred
            const swipedPet = pets.find((p: { id: string }) => p.id === petId)
            const userPet = user?.pets?.[0]
            if (swipedPet && userPet) {
              setMatchPetNames([userPet.name, swipedPet.name])
              setShowMatch(true)
            }
          }
        },
      })
    },
    [likePet, pets, user]
  )

  const handleMatchComplete = useCallback((): void => {
    setShowMatch(false)
    setMatchPetNames(['', ''])
  }, [])

  if (isTruthy(isLoading)) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        accessible
        accessibilityLabel={t.matching.loading}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text
            style={styles.loadingText}
            accessible
            accessibilityLabel={t.matching.loading}
          >
            {t.matching.loading}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isTruthy(error)) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        accessible
        accessibilityLabel={t.matching.error}
      >
        <View style={styles.centerContainer}>
          <Text
            style={styles.errorText}
            accessible
            accessibilityRole="alert"
            accessibilityLabel={t.matching.errorMessage}
          >
            {t.matching.errorMessage}
          </Text>
          <Pressable
            onPress={() => {
              void handleRefresh()
            }}
            style={styles.retryButton}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t.common.retry}
            accessibilityHint="Retries loading pets"
          >
            <Text style={styles.retryButtonText}>{t.common.retry}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      accessible
      accessibilityLabel={t.matching.title}
    >
      {!networkStatus.isConnected && (
        <Animated.View entering={FadeIn.duration(300)}>
          <OfflineIndicator />
        </Animated.View>
      )}
      <PullableContainer onRefresh={handleRefresh} refreshOptions={{ threshold: 100 }}>
        <View style={styles.container}>
          <SwipeCardStack
            pets={pets}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
          <MatchCelebration
            visible={showMatch}
            petNames={matchPetNames}
            onComplete={handleMatchComplete}
          />
        </View>
      </PullableContainer>
    </SafeAreaView>
  )
}

export function MatchingScreen(): React.JSX.Element {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.warn('MatchingScreen error', {
          error: error instanceof Error ? error.message : String(error),
        })
      }}
    >
      <MatchingScreenContent />
    </RouteErrorBoundary>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
})
