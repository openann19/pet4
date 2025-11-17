/**
 * Error boundary component for mobile app
 * Location: src/components/ErrorBoundary.tsx
 */

import { colors } from '@mobile/theme/colors'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { createLogger } from '../utils/logger'
import { isTruthy } from '@petspark/shared';

const logger = createLogger('ErrorBoundary')

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('ErrorBoundary caught an error', error, errorInfo)

    // Send to error monitoring service in production
    if (!__DEV__) {
      this.reportError(error, errorInfo).catch(reportErr => {
        logger.debug(
          'Failed to report error to monitoring service',
          reportErr instanceof Error ? reportErr : new Error(String(reportErr))
        )
      })
    }
  }

  private async reportError(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
      // Try to use Sentry if available
      // Dynamic import to avoid bundling Sentry if not available
      // Type assertion needed because @sentry/react-native may not be installed
      const SentryModule = (await import('@sentry/react-native' as string).catch(() => null)) as {
        default?: { captureException?: (error: Error, context?: unknown) => void }
      } | null
      if (SentryModule?.default?.captureException) {
        SentryModule.default.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        })
        return
      }
    } catch {
      // Sentry not available, fall through to custom endpoint
    }

    try {
      // Fallback to custom error reporting endpoint
      const errorEndpoint =
        (typeof process !== 'undefined' && process.env?.['EXPO_PUBLIC_ERROR_ENDPOINT']) ||
        '/api/errors'
      await fetch(errorEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch {
      // Silently fail - error reporting should not break the app
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  override render(): ReactNode {
    if (isTruthy(this.state.hasError)) {
      if (isTruthy(this.props.fallback)) {
        return this.props.fallback
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          {this.state.error && <Text style={styles.errorText}>{this.state.error.message}</Text>}
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'var(--color-bg-overlay)',
    fontSize: 16,
    fontWeight: '600',
  },
})
