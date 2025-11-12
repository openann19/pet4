/**
 * Biometric Authentication Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-biometric-auth.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useBiometricAuth, type BiometricAuthResult } from '../use-biometric-auth'
import * as LocalAuthentication from 'expo-local-authentication'
import * as Haptics from 'expo-haptics'
import type { LocalAuthenticationResult } from 'expo-local-authentication'

// Mock expo-local-authentication
vi.mock('expo-local-authentication', () => ({
  hasHardwareAsync: vi.fn(),
  isEnrolledAsync: vi.fn(),
  supportedAuthenticationTypesAsync: vi.fn(),
  authenticateAsync: vi.fn(),
}))

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  notificationAsync: vi.fn(),
  NotificationFeedbackType: {
    Success: 'success',
  },
}))

const mockLocalAuth = vi.mocked(LocalAuthentication)
const mockHaptics = vi.mocked(Haptics)

describe('useBiometricAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkAvailability', () => {
    it('should set isAvailable to true when hardware is available and enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true)
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true)
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([1, 2])

      const { result } = renderHook(() => useBiometricAuth())

      await act(async () => {
        await result.current.checkAvailability()
      })

      expect(result.current.isAvailable).toBe(true)
      expect(result.current.isSupported).toBe(true)
      expect(result.current.isEnrolled).toBe(true)
    })

    it('should set isAvailable to false when hardware is not available', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false)
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true)
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([1])

      const { result } = renderHook(() => useBiometricAuth())

      await act(async () => {
        await result.current.checkAvailability()
      })

      expect(result.current.isAvailable).toBe(false)
      expect(result.current.isSupported).toBe(false)
      expect(result.current.isEnrolled).toBe(true)
    })

    it('should set isAvailable to false when not enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true)
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false)
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([1])

      const { result } = renderHook(() => useBiometricAuth())

      await act(async () => {
        await result.current.checkAvailability()
      })

      expect(result.current.isAvailable).toBe(false)
      expect(result.current.isSupported).toBe(true)
      expect(result.current.isEnrolled).toBe(false)
    })

    it('should set isAvailable to false when no supported types', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true)
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true)
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([])

      const { result } = renderHook(() => useBiometricAuth())

      await act(async () => {
        await result.current.checkAvailability()
      })

      expect(result.current.isAvailable).toBe(false)
      expect(result.current.isSupported).toBe(true)
      expect(result.current.isEnrolled).toBe(true)
    })

    it('should handle errors gracefully', async () => {
      mockLocalAuth.hasHardwareAsync.mockRejectedValue(new Error('Hardware check failed'))

      const { result } = renderHook(() => useBiometricAuth())

      await act(async () => {
        await result.current.checkAvailability()
      })

      expect(result.current.isAvailable).toBe(false)
      expect(result.current.isSupported).toBe(false)
      expect(result.current.isEnrolled).toBe(false)
    })
  })

  describe('authenticate', () => {
    it('should authenticate successfully', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true)
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true)
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: true,
      } as LocalAuthentication.LocalAuthenticationResult)

      const { result } = renderHook(() => useBiometricAuth())

      let authResult: BiometricAuthResult | undefined
      await act(async () => {
        authResult = await result.current.authenticate('Authenticate to continue')
      })

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false)
      })

      expect(authResult?.success).toBe(true)
      expect(authResult?.error).toBeUndefined()
      expect(mockHaptics.notificationAsync).toHaveBeenCalledWith('success')
    })

    it('should return error when hardware is not available', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false)

      const { result } = renderHook(() => useBiometricAuth())

      let authResult: { success: boolean; error?: string | undefined } | undefined
      await act(async () => {
        authResult = await result.current.authenticate()
      })

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false)
      })

      expect(authResult?.success).toBe(false)
      expect(authResult?.error).toBe('Biometric authentication hardware not available')
    })

    it('should return error when not enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true)
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false)

      const { result } = renderHook(() => useBiometricAuth())

      let authResult: { success: boolean; error?: string | undefined } | undefined
      await act(async () => {
        authResult = await result.current.authenticate()
      })

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false)
      })

      expect(authResult?.success).toBe(false)
      expect(authResult?.error).toBe('No biometric credentials enrolled')
    })

    it('should return error when authentication fails', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true)
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true)
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: false,
        error: 'UserCancel',
      } as LocalAuthentication.LocalAuthenticationResult)

      const { result } = renderHook(() => useBiometricAuth())

      let authResult: { success: boolean; error?: string | undefined } | undefined
      await act(async () => {
        authResult = await result.current.authenticate()
      })

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false)
      })

      expect(authResult?.success).toBe(false)
      expect(authResult?.error).toBe('Authentication failed')
    })

    it('should handle authentication errors', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true)
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true)
      mockLocalAuth.authenticateAsync.mockRejectedValue(new Error('Authentication error'))

      const { result } = renderHook(() => useBiometricAuth())

      let authResult: { success: boolean; error?: string | undefined } | undefined
      await act(async () => {
        authResult = await result.current.authenticate()
      })

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false)
      })

      expect(authResult?.success).toBe(false)
      expect(authResult?.error).toBe('Authentication error')
    })

    it('should set isAuthenticating during authentication', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true)
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true)
      let resolveAuth: (value: LocalAuthentication.LocalAuthenticationResult) => void
      const authPromise = new Promise<LocalAuthentication.LocalAuthenticationResult>(
        resolve => {
          resolveAuth = resolve
        }
      )
      mockLocalAuth.authenticateAsync.mockReturnValue(authPromise)

      const { result } = renderHook(() => useBiometricAuth())

      act(() => {
        void result.current.authenticate()
      })

      expect(result.current.isAuthenticating).toBe(true)

      await act(async () => {
        resolveAuth!({ success: true } as LocalAuthentication.LocalAuthenticationResult)
        await authPromise
      })

      await waitFor(() => {
        expect(result.current.isAuthenticating).toBe(false)
      })
    })

    it('should use default prompt message when not provided', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true)
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true)
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: true,
      } as LocalAuthentication.LocalAuthenticationResult)

      const { result } = renderHook(() => useBiometricAuth())

      await act(async () => {
        await result.current.authenticate()
      })

      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      })
    })

    it('should use custom prompt message when provided', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true)
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true)
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: true,
      } as LocalAuthentication.LocalAuthenticationResult)

      const { result } = renderHook(() => useBiometricAuth())

      await act(async () => {
        await result.current.authenticate('Custom prompt message')
      })

      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith({
        promptMessage: 'Custom prompt message',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      })
    })
  })

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useBiometricAuth())

      expect(result.current.isAvailable).toBe(false)
      expect(result.current.isSupported).toBe(false)
      expect(result.current.isEnrolled).toBe(false)
      expect(result.current.isAuthenticating).toBe(false)
      expect(typeof result.current.checkAvailability).toBe('function')
      expect(typeof result.current.authenticate).toBe('function')
    })
  })
})
