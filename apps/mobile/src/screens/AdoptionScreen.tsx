import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FeatureCard } from '@mobile/components/FeatureCard'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { colors } from '@mobile/theme/colors'
import { useDomainSnapshots } from '@mobile/hooks/useDomainSnapshots'
import { samplePets } from '@mobile/data/mockData'

export function AdoptionScreen() {
  const { adoption } = useDomainSnapshots()
  const [primaryPet] = samplePets

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="Adoption domain parity"
          description="Shared rules ensure that marketplace moderation behaves consistently across platforms."
        />

        <FeatureCard
          title={`Listing: ${primaryPet.name}`}
          subtitle={`${primaryPet.location.city}, ${primaryPet.location.country}`}
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
