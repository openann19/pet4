import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FeatureCard } from '@mobile/components/FeatureCard'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { colors } from '@mobile/theme/colors'
import { samplePets } from '@mobile/data/mockData'

export function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="Operator overview"
          description="Snapshot of mobile-ready records pulled directly from the shared domain schema."
        />

        {samplePets.map(pet => (
          <FeatureCard key={pet.id} title={pet.name} subtitle={`${pet.breedName} • ${pet.location.city}`}>
            <View style={styles.row}>
              <Text style={styles.label}>Life stage</Text>
              <Text style={styles.value}>{pet.lifeStage}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Intents</Text>
              <Text style={styles.value}>{pet.intents.join(', ')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>KYC</Text>
              <Text style={[styles.value, pet.kycVerified ? styles.success : styles.warning]}>
                {pet.kycVerified ? 'verified' : 'pending'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Vet docs</Text>
              <Text style={[styles.value, pet.vetVerified ? styles.success : styles.warning]}>
                {pet.vetVerified ? 'verified' : 'missing'}
              </Text>
            </View>
          </FeatureCard>
        ))}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '600'
  },
  value: {
    color: colors.textSecondary,
    textTransform: 'capitalize'
  },
  success: {
    color: colors.success
  },
  warning: {
    color: colors.warning
  }
})
