import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FeatureCard } from '@mobile/components/FeatureCard'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { colors } from '@mobile/theme/colors'
import { useDomainSnapshots } from '@mobile/hooks/useDomainSnapshots'

export function MatchingScreen() {
  const { matching } = useDomainSnapshots()
  const factorEntries = Object.entries(matching.score.factorScores)

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="Matching intelligence"
          description="Real-time scoring powered by the shared domain layer keeps decisions deterministic across clients."
        />

        <FeatureCard title="Hard gate evaluation">
          <Text style={styles.bodyText}>
            Result: {matching.hardGatesPassed ? 'Passed' : 'Blocked'}
          </Text>
          {matching.hardGateFailures.length > 0 ? (
            <View style={styles.list}>
              {matching.hardGateFailures.map(failure => (
                <Text key={failure.code} style={styles.failureText}>
                  {failure.code}: {failure.message}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.successText}>No blocking issues detected.</Text>
          )}
        </FeatureCard>

        <FeatureCard title="Factor weights" subtitle="Breakdown of the composite score">
          {factorEntries.map(([key, value]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key}</Text>
              <Text style={styles.value}>{value.toFixed(1)}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={[styles.label, styles.totalLabel]}>Total</Text>
            <Text style={[styles.value, styles.totalValue]}>{matching.score.totalScore.toFixed(1)}</Text>
          </View>
        </FeatureCard>

        <FeatureCard title="Positive signals">
          {matching.score.explanation.positive.map((item, index) => (
            <Text key={`positive-${index}`} style={styles.successText}>
              • {item.en}
            </Text>
          ))}
        </FeatureCard>

        <FeatureCard title="Negative signals">
          {matching.score.explanation.negative.length === 0 ? (
            <Text style={styles.successText}>No negative modifiers applied.</Text>
          ) : (
            matching.score.explanation.negative.map((item, index) => (
              <Text key={`negative-${index}`} style={styles.bodyText}>
                • {item.en}
              </Text>
            ))
          )}
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
  successText: {
    color: colors.success,
    fontSize: 14,
    lineHeight: 20
  },
  list: {
    marginTop: 8,
    gap: 6
  },
  failureText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
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
    textTransform: 'capitalize'
  },
  value: {
    color: colors.textSecondary,
    fontWeight: '600'
  },
  totalLabel: {
    fontWeight: '700'
  },
  totalValue: {
    color: colors.textPrimary,
    fontSize: 16
  }
})
