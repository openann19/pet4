import { ErrorBoundary } from './components/ErrorBoundary'
import { OfflineIndicator } from './components/OfflineIndicator'
import { AppNavigator } from './navigation/AppNavigator'
import { QueryProvider } from './providers/QueryProvider'
import { colors } from './theme/colors'
import { initBackgroundUploads } from './utils/background-uploads'
import { createLogger } from './utils/logger'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const logger = createLogger('App')

export default function App(): React.JSX.Element {
  useEffect(() => {
    initBackgroundUploads().catch((error: unknown) => {
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
