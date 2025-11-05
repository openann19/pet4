import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FeatureCard } from '@mobile/components/FeatureCard'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { colors } from '@mobile/theme/colors'
import { useDomainSnapshots } from '@mobile/hooks/useDomainSnapshots'

export function CommunityScreen() {
  const { community } = useDomainSnapshots()

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="Community safety rails"
          description="Moderation and engagement policies mirrored from the web app ensure identical enforcement."
        />

        <FeatureCard title="Post moderation">
          <Text style={styles.bodyText}>
            Pending posts can be edited: {community.canEditPendingPost ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.bodyText}>
            Comments allowed on active posts: {community.canReceiveCommentsOnActivePost ? 'Yes' : 'No'}
          </Text>
        </FeatureCard>

        <FeatureCard title="Post transitions">
          {community.postTransitions.map(item => (
            <View key={item.status} style={styles.row}>
              <Text style={styles.label}>{item.status}</Text>
              <Text style={[styles.value, item.allowed ? styles.success : styles.blocked]}>
                {item.allowed ? 'permitted' : 'blocked'}
              </Text>
            </View>
          ))}
        </FeatureCard>

        <FeatureCard title="Comment transitions">
          {community.commentTransitions.map(item => (
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
