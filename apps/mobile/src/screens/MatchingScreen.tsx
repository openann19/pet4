import { PullableContainer } from '@mobile/components/PullableContainer'
import { MatchCelebration } from '@mobile/components/swipe/MatchCelebration'
import { SwipeCardStack } from '@mobile/components/swipe/SwipeCardStack'
import { useDislikePet, useLikePet, usePets } from '@mobile/hooks/use-pets'
import { useUserStore } from '@mobile/store/user-store'
import { colors } from '@mobile/theme/colors'
import React, { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { ApiResponse } from '../types/api'
import type { Match } from '../types/pet'
import { isTruthy, isDefined } from '@petspark/shared';

export function MatchingScreen(): React.JSX.Element {
  const [showMatch, setShowMatch] = useState(false)
  const [matchPetNames, setMatchPetNames] = useState<[string, string]>(['', ''])
  const { data, isLoading, error, refetch } = usePets()
  const likePet = useLikePet()
  const dislikePet = useDislikePet()
  const { user } = useUserStore()

  const handleRefresh = useCallback(async (): Promise<void> => {
    await refetch()
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading pets...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isTruthy(error)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error loading pets. Please try again.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
  },
})
