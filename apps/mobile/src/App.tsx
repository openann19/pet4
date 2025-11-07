import { ErrorBoundary } from '@mobile/components/ErrorBoundary'
import { OfflineIndicator } from '@mobile/components/OfflineIndicator'
import { AppNavigator } from '@mobile/navigation/AppNavigator'
import { QueryProvider } from '@mobile/providers/QueryProvider'
import { colors } from '@mobile/theme/colors'
import { initBackgroundUploads } from '@mobile/utils/background-uploads'
import { createLogger } from '@mobile/utils/logger'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const logger = createLogger('App')

export default function App(): React.JSX.Element {
  useEffect(() => {
    initBackgroundUploads().catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to initialize background uploads', err)
    })
  }, [])

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryProvider>
          <StatusBar style="light" backgroundColor={colors.card} />
          <OfflineIndicator />
          <AppNavigator />
        </QueryProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
