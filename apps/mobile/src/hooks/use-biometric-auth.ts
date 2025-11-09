/**
 * Biometric authentication hook
 * Location: src/hooks/use-biometric-auth.ts
 */

import * as Haptics from 'expo-haptics'
import * as LocalAuthentication from 'expo-local-authentication'
import { useState } from 'react'

export interface BiometricAuthResult {
  success: boolean
  error?: string | undefined
}

export interface UseBiometricAuthReturn {
  isAvailable: boolean
  isSupported: boolean
  isEnrolled: boolean
  checkAvailability: () => Promise<void>
  authenticate: (promptMessage?: string) => Promise<BiometricAuthResult>
  isAuthenticating: boolean
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const checkAvailability = async (): Promise<void> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()

      setIsSupported(hasHardware)
      setIsEnrolled(enrolled)
      setIsAvailable(hasHardware && enrolled && supportedTypes.length > 0)
    } catch {
      setIsAvailable(false)
      setIsSupported(false)
      setIsEnrolled(false)
    }
  }

  const authenticate = async (
    promptMessage: string = 'Authenticate to continue'
  ): Promise<BiometricAuthResult> => {
    setIsAuthenticating(true)

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()

      if (!hasHardware) {
        return {
          success: false,
          error: 'Biometric authentication hardware not available',
        }
      }

      if (!enrolled) {
        return {
          success: false,
          error: 'No biometric credentials enrolled',
        }
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      })

      if (result.success) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        return {
          success: true,
        }
      }
      return {
        success: false,
        error: 'Authentication failed',
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication error occurred'
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setIsAuthenticating(false)
    }
  }

  return {
    isAvailable,
    isSupported,
    isEnrolled,
    checkAvailability,
    authenticate,
    isAuthenticating,
  }
}
