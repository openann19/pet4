import React, { useCallback } from 'react'

import { FeatureCard } from '@mobile/components/FeatureCard'
import { PullableContainer } from '@mobile/components/PullableContainer'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { useDomainSnapshots } from '@mobile/hooks/use-domain-snapshots'
import { colors } from '@mobile/theme/colors'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function HomeScreen(): React.JSX.Element {
  const snapshots = useDomainSnapshots()

  const handleRefresh = useCallback(async (): Promise<void> => {
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))
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
            title="PetSpark Mobile Readiness"
            description="Key slices from the shared domain layer rendered with native-first components."
          />

          <FeatureCard title="Adoption" subtitle="Marketplace governance and workflows">
            <Text style={styles.bodyText}>
              Active listings can be edited:{' '}
              {snapshots.adoption.canEditActiveListing ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.bodyText}>
              Accepting new applications:{' '}
              {snapshots.adoption.canReceiveApplications ? 'Enabled' : 'Paused'}
            </Text>
          </FeatureCard>

          <FeatureCard title="Community" subtitle="Engagement guardrails">
            <Text style={styles.bodyText}>
              Pending posts editable:{' '}
              {snapshots.community.canEditPendingPost ? 'Allowed' : 'Locked'}
            </Text>
            <Text style={styles.bodyText}>
              Comments on live posts:{' '}
              {snapshots.community.canReceiveCommentsOnActivePost ? 'Open' : 'Closed'}
            </Text>
          </FeatureCard>

          <FeatureCard title="Matching" subtitle="Signal-driven pairing">
            <Text style={styles.bodyText}>
              Hard gates: {snapshots.matching.hardGatesPassed ? 'All clear' : 'Requires review'}
            </Text>
            <Text style={styles.bodyText}>
              Weighted score: {Number(snapshots.matching.score.totalScore).toFixed(1)} / 100
            </Text>
          </FeatureCard>

          <View style={styles.footer} accessible accessibilityRole="text">
            <Text style={styles.footerText}>
              Navigation routes map directly to production domain slices, keeping parity with the
              web surface.
            </Text>
          </View>
        </ScrollView>
      </PullableContainer>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 28 },
  bodyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  footer: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: colors.surface },
  footerText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
})
