import React, { memo, useCallback } from 'react'

import { FeatureCard } from '@mobile/components/FeatureCard'
import { PullableContainer } from '@mobile/components/PullableContainer'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { useDomainSnapshots } from '@mobile/hooks/use-domain-snapshots'
import { colors } from '@mobile/theme/colors'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function CommunityScreen(): React.JSX.Element {
  const { data } = useDomainSnapshots()
  const community = data.community

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
            title="Community safety rails"
            description="Moderation and engagement policies mirrored from the web app ensure identical enforcement."
          />

          <FeatureCard title="Post moderation">
            <BodyLine
              text={`Pending posts can be edited: ${community.canEditPendingPost ? 'Yes' : 'No'}`}
            />
            <BodyLine
              text={`Comments allowed on active posts: ${
                community.canReceiveCommentsOnActivePost ? 'Yes' : 'No'
              }`}
            />
          </FeatureCard>

          <FeatureCard title="Post transitions">
            {community.postTransitions.map(item => (
              <StatusRow key={`post:${item.status}`} label={item.status} allowed={item.allowed} />
            ))}
          </FeatureCard>

          <FeatureCard title="Comment transitions">
            {community.commentTransitions.map(item => (
              <StatusRow
                key={`comment:${item.status}`}
                label={item.status}
                allowed={item.allowed}
              />
            ))}
          </FeatureCard>
        </ScrollView>
      </PullableContainer>
    </SafeAreaView>
  )
}

const BodyLine = memo(({ text }: { text: string }) => (
  <Text style={styles.bodyText} accessibilityRole="text">
    {text}
  </Text>
))

const StatusRow = memo(({ label, allowed }: { label: string; allowed: boolean }) => {
  return (
    <View style={styles.row} accessible accessibilityRole="summary">
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, allowed ? styles.success : styles.blocked]}>
        {allowed ? 'permitted' : 'blocked'}
      </Text>
    </View>
  )
})

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 28 },
  bodyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textPrimary, fontWeight: '600' },
  value: { textTransform: 'uppercase', fontSize: 12 },
  success: { color: colors.success },
  blocked: { color: colors.danger },
})
