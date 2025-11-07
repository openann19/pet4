import React, { memo, useCallback } from 'react'

import { FeatureCard } from '@mobile/components/FeatureCard'
import { PullableContainer } from '@mobile/components/PullableContainer'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { samplePets } from '@mobile/data/mock-data'
import { colors } from '@mobile/theme/colors'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function ProfileScreen(): React.JSX.Element {
  const handleRefresh = useCallback(async (): Promise<void> => {
    // Simulate network delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500))
  }, [])

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <PullableContainer onRefresh={handleRefresh}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader
            title="Operator overview"
            description="Snapshot of mobile-ready records pulled directly from the shared domain schema."
          />

          {samplePets.map((pet) => (
            <FeatureCard
              key={pet.id}
              title={pet.name}
              subtitle={`${String(pet.breedName ?? '')} • ${String(pet.location.city ?? '')}`}
            >
              <InfoRow label="Life stage" value={pet.lifeStage} />
              <InfoRow
                label="Intents"
                value={Array.isArray(pet.intents) && pet.intents.length ? pet.intents.join(', ') : '—'}
              />
              <InfoRow
                label="KYC"
                value={pet.kycVerified ? 'verified' : 'pending'}
                tone={pet.kycVerified ? 'success' : 'warning'}
              />
              <InfoRow
                label="Vet docs"
                value={pet.vetVerified ? 'verified' : 'missing'}
                tone={pet.vetVerified ? 'success' : 'warning'}
              />
            </FeatureCard>
          ))}
        </ScrollView>
      </PullableContainer>
    </SafeAreaView>
  )
}

type Tone = 'default' | 'success' | 'warning'

const InfoRow = memo(({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: Tone
}) => {
  const valueStyle =
    tone === 'success' ? styles.success : tone === 'warning' ? styles.warning : styles.value
  return (
    <View style={styles.row} accessible accessibilityRole="summary">
      <Text style={styles.label}>{label}</Text>
      <Text style={valueStyle} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  )
})

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 28 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textPrimary, fontWeight: '600' },
  value: { color: colors.textSecondary, textTransform: 'capitalize' },
  success: { color: colors.success, textTransform: 'capitalize' },
  warning: { color: colors.warning, textTransform: 'capitalize' },
})
