/**
 * Tests for secure storage utilities
 * Location: src/__tests__/utils/secure-storage.test.ts
 */

import * as SecureStore from 'expo-secure-store'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearCache,
  deleteAuthToken,
  deleteMultipleSecureValues,
  deleteSecureValue,
  getAuthToken,
  getMultipleSecureValues,
  getSecureValue,
  hasAuthToken,
  hasSecureValue,
  KeychainAccessibility,
  saveAuthToken,
  saveMultipleSecureValues,
  saveSecureValue,
  secureStorage,
} from '../../utils/secure-storage'

vi.mock('expo-secure-store')

describe('Secure Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCache()
  })

  describe('saveSecureValue', () => {
    it('should save a value securely with normalized key', async () => {
      vi.mocked(SecureStore.setItemAsync).mockResolvedValue()

      await saveSecureValue('test-key', 'test-value')

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'pawfect_test-key',
        'test-value',
        expect.any(Object)
      )
    })

    it('should throw error on invalid key', async () => {
      await expect(saveSecureValue('', 'test-value')).rejects.toThrow()
      await expect(saveSecureValue('key with spaces', 'test-value')).rejects.toThrow()
      await expect(saveSecureValue('key@invalid', 'test-value')).rejects.toThrow()
    })

    it('should throw error on invalid value', async () => {
      // @ts-expect-error - Testing invalid input
      await expect(saveSecureValue('test-key', null)).rejects.toThrow()
      // @ts-expect-error - Testing invalid input
      await expect(saveSecureValue('test-key', undefined)).rejects.toThrow()
    })

    it('should throw error on failure', async () => {
      vi.mocked(SecureStore.setItemAsync).mockRejectedValue(
        new Error('Save failed')
      )

      await expect(saveSecureValue('test-key', 'test-value')).rejects.toThrow()
    })

    it('should use custom keychain accessibility', async () => {
      vi.mocked(SecureStore.setItemAsync).mockResolvedValue()

      await saveSecureValue('test-key', 'test-value', {
        keychainAccessible: KeychainAccessibility.AFTER_FIRST_UNLOCK,
      })

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'pawfect_test-key',
        'test-value',
        expect.objectContaining({
          keychainAccessible: KeychainAccessibility.AFTER_FIRST_UNLOCK,
        })
      )
    })

    it('should cache value by default', async () => {
      vi.mocked(SecureStore.setItemAsync).mockResolvedValue()
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue('test-value')

      await saveSecureValue('test-key', 'test-value')
      
      // Second call should use cache
      const value = await getSecureValue('test-key')
      expect(value).toBe('test-value')
      // Should only call getItemAsync once (not from cache hit)
      expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1)
    })

    it('should skip cache when option is set', async () => {
      vi.mocked(SecureStore.setItemAsync).mockResolvedValue()
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue('test-value')

      await saveSecureValue('test-key', 'test-value', { skipCache: true })
      
      const value = await getSecureValue('test-key')
      expect(value).toBe('test-value')
    })
  })

  describe('getSecureValue', () => {
    it('should retrieve a value securely with normalized key', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue('test-value')

      const value = await getSecureValue('test-key')

      expect(value).toBe('test-value')
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('pawfect_test-key')
    })

    it('should return null on error', async () => {
      vi.mocked(SecureStore.getItemAsync).mockRejectedValue(
        new Error('Get failed')
      )

      const value = await getSecureValue('test-key')

      expect(value).toBeNull()
    })

    it('should use cache when available', async () => {
      vi.mocked(SecureStore.setItemAsync).mockResolvedValue()

      await saveSecureValue('cached-key', 'cached-value')
      
      // Clear mock to ensure we're using cache
      vi.mocked(SecureStore.getItemAsync).mockClear()
      
      const value = await getSecureValue('cached-key', { skipCache: false })
      expect(value).toBe('cached-value')
      // Should not call getItemAsync if cache hit
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled()
    })

    it('should throw error on invalid key', async () => {
      await expect(getSecureValue('')).rejects.toThrow()
    })
  })

  describe('deleteSecureValue', () => {
    it('should delete a value securely with normalized key', async () => {
      vi.mocked(SecureStore.deleteItemAsync).mockResolvedValue()

      await deleteSecureValue('test-key')

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('pawfect_test-key')
    })

    it('should clear cache on delete', async () => {
      vi.mocked(SecureStore.setItemAsync).mockResolvedValue()
      vi.mocked(SecureStore.deleteItemAsync).mockResolvedValue()

      await saveSecureValue('test-key', 'test-value')
      await deleteSecureValue('test-key')
      
      // Should not find in cache
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue(null)
      const value = await getSecureValue('test-key', { skipCache: true })
      expect(value).toBeNull()
    })

    it('should throw error on invalid key', async () => {
      await expect(deleteSecureValue('')).rejects.toThrow()
    })
  })

  describe('hasSecureValue', () => {
    it('should return true if value exists', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue('test-value')

      const exists = await hasSecureValue('test-key')

      expect(exists).toBe(true)
    })

    it('should return false if value does not exist', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue(null)

      const exists = await hasSecureValue('test-key')

      expect(exists).toBe(false)
    })

    it('should return false on error', async () => {
      vi.mocked(SecureStore.getItemAsync).mockRejectedValue(
        new Error('Get failed')
      )

      const exists = await hasSecureValue('test-key')

      expect(exists).toBe(false)
    })
  })

  describe('Batch operations', () => {
    describe('getMultipleSecureValues', () => {
      it('should get multiple values', async () => {
        vi.mocked(SecureStore.getItemAsync)
          .mockResolvedValueOnce('value1')
          .mockResolvedValueOnce('value2')
          .mockResolvedValueOnce(null)

        const results = await getMultipleSecureValues(['key1', 'key2', 'key3'])

        expect(results.size).toBe(3)
        expect(results.get('key1')).toBe('value1')
        expect(results.get('key2')).toBe('value2')
        expect(results.get('key3')).toBeNull()
      })
    })

    describe('saveMultipleSecureValues', () => {
      it('should save multiple values', async () => {
        vi.mocked(SecureStore.setItemAsync).mockResolvedValue()

        await saveMultipleSecureValues([
          { key: 'key1', value: 'value1' },
          { key: 'key2', value: 'value2' },
        ])

        expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2)
      })
    })

    describe('deleteMultipleSecureValues', () => {
      it('should delete multiple values', async () => {
        vi.mocked(SecureStore.deleteItemAsync).mockResolvedValue()

        await deleteMultipleSecureValues(['key1', 'key2'])

        expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2)
      })

      it('should continue on individual failures', async () => {
        vi.mocked(SecureStore.deleteItemAsync)
          .mockRejectedValueOnce(new Error('Failed'))
          .mockResolvedValueOnce(undefined)

        await expect(
          deleteMultipleSecureValues(['key1', 'key2'])
        ).resolves.not.toThrow()

        expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Cache management', () => {
    it('should clear cache', () => {
      expect(() => { clearCache(); }).not.toThrow()
    })
  })

  describe('Auth token helpers', () => {
    it('should save auth token', async () => {
      vi.mocked(SecureStore.setItemAsync).mockResolvedValue()

      await saveAuthToken('token-123')

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'pawfect_auth_token',
        'token-123',
        expect.objectContaining({
          keychainAccessible: KeychainAccessibility.WHEN_UNLOCKED,
          requireAuthentication: false,
        })
      )
    })

    it('should get auth token', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue('token-123')

      const token = await getAuthToken()

      expect(token).toBe('token-123')
    })

    it('should delete auth token', async () => {
      vi.mocked(SecureStore.deleteItemAsync).mockResolvedValue()

      await deleteAuthToken()

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('pawfect_auth_token')
    })

    it('should check if auth token exists', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue('token-123')

      const exists = await hasAuthToken()

      expect(exists).toBe(true)
    })
  })

  describe('secureStorage compatibility interface', () => {
    it('should provide getItem method', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue('test-value')

      const value = await secureStorage.getItem('test-key')

      expect(value).toBe('test-value')
    })

    it('should provide setItem method', async () => {
      vi.mocked(SecureStore.setItemAsync).mockResolvedValue()

      await secureStorage.setItem('test-key', 'test-value')

      expect(SecureStore.setItemAsync).toHaveBeenCalled()
    })

    it('should provide removeItem method', async () => {
      vi.mocked(SecureStore.deleteItemAsync).mockResolvedValue()

      await secureStorage.removeItem('test-key')

      expect(SecureStore.deleteItemAsync).toHaveBeenCalled()
    })

    it('should provide hasItem method', async () => {
      vi.mocked(SecureStore.getItemAsync).mockResolvedValue('test-value')

      const exists = await secureStorage.hasItem('test-key')

      expect(exists).toBe(true)
    })

    it('should provide clearCache method', () => {
      expect(() => { secureStorage.clearCache(); }).not.toThrow()
    })
  })

  describe('KeychainAccessibility constants', () => {
    it('should export all accessibility constants', () => {
      expect(KeychainAccessibility.WHEN_UNLOCKED).toBeDefined()
      expect(KeychainAccessibility.AFTER_FIRST_UNLOCK).toBeDefined()
      expect(KeychainAccessibility.WHEN_UNLOCKED_THIS_DEVICE_ONLY).toBeDefined()
      expect(KeychainAccessibility.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY).toBeDefined()
      expect(KeychainAccessibility.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY).toBeDefined()
    })
  })
})
