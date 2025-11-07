import { FeatureCard } from '@mobile/components/FeatureCard'
import { PullableContainer } from '@mobile/components/PullableContainer'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { samplePets } from '@mobile/data/mock-data'
import { useDomainSnapshots } from '@mobile/hooks/use-domain-snapshots'
import { colors } from '@mobile/theme/colors'
import { useCallback } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function AdoptionScreen(): React.JSX.Element {
  const { adoption } = useDomainSnapshots()
  const [primaryPet] = samplePets

  const handleRefresh = useCallback(async (): Promise<void> => {
    // Force re-render by updating key, which will re-run useDomainSnapshots
    // Simulate network delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500))
  }, [])

  if (!primaryPet) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.bodyText}>No pet data available</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <PullableContainer onRefresh={handleRefresh}>
        <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="Adoption domain parity"
          description="Shared rules ensure that marketplace moderation behaves consistently across platforms."                                                  
        />

        <FeatureCard
          title={`Listing: ${String(primaryPet.name ?? '')}`}
          subtitle={`${String(primaryPet.location.city ?? '')}, ${String(primaryPet.location.country ?? '')}`}
        >
          <Text style={styles.bodyText}>Status: active</Text>
          <Text style={styles.bodyText}>
            Owner can edit: {adoption.canEditActiveListing ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.bodyText}>
            Applications accepted: {adoption.canReceiveApplications ? 'Yes' : 'No'}
          </Text>
        </FeatureCard>

        <FeatureCard title="Allowed listing transitions">
          {adoption.statusTransitions.map(item => (
            <View key={item.status} style={styles.row}>
              <Text style={styles.label}>{item.status}</Text>
              <Text style={[styles.value, item.allowed ? styles.success : styles.blocked]}>
                {item.allowed ? 'permitted' : 'blocked'}
              </Text>
            </View>
          ))}
        </FeatureCard>

        <FeatureCard title="Application workflow">
          {adoption.applicationTransitions.map(item => (
            <View key={item.status} style={styles.row}>
              <Text style={styles.label}>{item.status}</Text>
              <Text style={[styles.value, item.allowed ? styles.success : styles.blocked]}>
                {item.allowed ? 'permitted' : 'blocked'}
              </Text>
            </View>
          ))}
        </FeatureCard>
        </ScrollView>
      </PullableContainer>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 20
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '600'
  },
  value: {
    textTransform: 'uppercase',
    fontSize: 12
  },
  success: {
    color: colors.success
  },
  blocked: {
    color: colors.danger
  }
})
