/**
 * AdoptScreen Component
 *
 * Screen for browsing and applying for adoptions. Displays marketplace
 * information and adoption listings.
 *
 * Features:
 * - Error handling with RouteErrorBoundary
 * - Offline support
 * - Accessibility support
 * - i18n support
 * - Animations with React Reanimated
 *
 * @example
 * <AdoptScreen />
 */
import React from 'react'

import { FeatureCard } from '@mobile/components/FeatureCard'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { RouteErrorBoundary } from '@mobile/components/RouteErrorBoundary'
import { OfflineIndicator } from '@mobile/components/OfflineIndicator'
import { useNetworkStatus } from '@mobile/hooks/use-network-status'
import { colors } from '@mobile/theme/colors'
import { getTranslations } from '@mobile/i18n/translations'
import { createLogger } from '@mobile/utils/logger'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Animated, FadeIn } from '@petspark/motion'

const logger = createLogger('AdoptScreen')

const language = 'en'
const t = getTranslations(language)

function AdoptScreenContent(): React.JSX.Element {
  const networkStatus = useNetworkStatus()

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'left', 'right']}
      accessible
      accessibilityLabel={t.adopt.title}
      accessibilityRole="header"
      accessibilityHint={t.adopt.description}
    >
      <View style={styles.container}>
        {!networkStatus.isConnected && (
          <Animated.View entering={FadeIn.duration(300)}>
            <OfflineIndicator />
          </Animated.View>
        )}
        <SectionHeader
          title={t.adopt.title}
          description={t.adopt.description}
        />
        <FeatureCard
          title={t.adopt.marketplace.title}
          accessible
          accessibilityLabel={`${t.adopt.marketplace.title}. ${t.adopt.marketplace.comingSoon}`}
          accessibilityRole="text"
          accessibilityHint={t.adopt.marketplace.comingSoon}
        >
          <Text
            style={styles.text}
            accessible
            accessibilityLabel={t.adopt.marketplace.comingSoon}
          >
            {t.adopt.marketplace.comingSoon}
          </Text>
        </FeatureCard>
      </View>
    </SafeAreaView>
  )
}

export function AdoptScreen(): React.ReactElement {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.warn('AdoptScreen error', {
          error: error instanceof Error ? error.message : String(error),
        })
      }}
    >
      <AdoptScreenContent />
    </RouteErrorBoundary>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 16 },
  text: { color: colors.textSecondary },
})
