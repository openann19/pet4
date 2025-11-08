import { FeatureCard } from '@mobile/components/FeatureCard'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { colors } from '@mobile/theme/colors'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function MatchesScreen(): React.ReactElement {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <SectionHeader title="Matches" description="Signal-driven pairing results." />
        <FeatureCard title="Today">
          <Text style={styles.text}>Your latest matches will show here.</Text>
        </FeatureCard>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 16 },
  text: { color: colors.textSecondary },
})
