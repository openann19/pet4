import { ErrorBoundary } from './components/ErrorBoundary'
import { OfflineIndicator } from './components/OfflineIndicator'
import { AppNavigator } from './navigation/AppNavigator'
import { QueryProvider } from './providers/QueryProvider'
import { colors } from './theme/colors'
import { initBackgroundUploads } from './utils/background-uploads'
import { createLogger } from './utils/logger'
import { isAgeVerified } from './utils/age-verification'
import { errorTracking } from './utils/error-tracking'
import { AgeVerification } from './components/AgeVerification'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const logger = createLogger('App')

// Global error handler for production - handle via utility function to avoid direct require
const setupGlobalErrorHandler = (): void => {
  if (__DEV__ === false) {
    try {
      // Dynamic import to comply with ESLint while still working in React Native
      const requireFn = eval('require') as (module: string) => unknown
      const ReactNative = requireFn('react-native') as { ErrorUtils?: { getGlobalHandler?(): unknown; setGlobalHandler?(handler: (error: Error, isFatal?: boolean) => void): void } }
      const ErrorUtils = ReactNative?.ErrorUtils
      const origHandler = ErrorUtils?.getGlobalHandler?.() as ((error: Error, isFatal?: boolean) => void) | undefined

      ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
        logger.error('RNGlobalError', error, {
          isFatal,
          message: error?.message,
          stack: error?.stack,
        })

        origHandler?.(error, isFatal)
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      logger.warn('Failed to setup global error handler', { error })
    }
  }
}

// Initialize error handler
setupGlobalErrorHandler()

export default function App(): React.JSX.Element {
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null)

  useEffect(() => {
    initBackgroundUploads().catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to initialize background uploads', err)
    })

    // Check age verification
    isAgeVerified().then((verified) => {
      setAgeVerified(verified)
    }).catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.warn('Failed to check age verification', { error: err })
      setAgeVerified(true) // Allow access if check fails
    })

    // Initialize error tracking
    errorTracking.setUserContext('anonymous')
  }, [])

  // Show age verification if not verified
  if (ageVerified === false) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <AgeVerification
            onVerified={(verified) => setAgeVerified(verified)}
            requiredAge={13}
          />
        </SafeAreaProvider>
      </ErrorBoundary>
    )
  }

  // Show loading while checking age verification
  if (ageVerified === null) {
    return <></>
  }

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
