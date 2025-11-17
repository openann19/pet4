/**
 * Tests for API Client
 * Location: src/__tests__/utils/api-client.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { APIError, APIErrorType, apiClient, matchingApi } from '../../utils/api-client'
import { cacheGet, cacheSet } from '../../utils/offline-cache'
import { getAuthToken } from '../../utils/secure-storage'
import { telemetry } from '../../utils/telemetry'

// Mock dependencies
vi.mock('../../utils/secure-storage')
vi.mock('../../utils/offline-cache')
vi.mock('../../utils/telemetry')
vi.mock('../../utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

// Mock fetch globally
global.fetch = vi.fn()

describe('APIClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiClient.resetCircuitBreaker()
    apiClient.clearRequestCache()
    vi.mocked(getAuthToken).mockResolvedValue(null)
    vi.mocked(cacheGet).mockResolvedValue(null)
    vi.mocked(cacheSet).mockResolvedValue()
  })

  describe('get', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = { data: 'test' }
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockResponse,
      } as Response)

      const result = await apiClient.get('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should include auth token in headers when available', async () => {
      vi.mocked(getAuthToken).mockResolvedValue('token-123')
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      } as Response)

      await apiClient.get('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token-123',
          }),
        })
      )
    })

    it('should use cached response when available', async () => {
      const cachedData = { data: 'cached' }
      vi.mocked(cacheGet).mockResolvedValue({
        data: cachedData,
        etag: 'etag-123',
        timestamp: Date.now(),
      })

      const result = await apiClient.get('/test', {
        cacheKey: 'test-cache',
        skipCache: false,
      })

      expect(cacheGet).toHaveBeenCalled()
      expect(global.fetch).not.toHaveBeenCalled()
      expect(result).toEqual(cachedData)
    })

    it('should cache successful GET responses', async () => {
      const mockResponse = { data: 'test' }
      const mockHeaders = new Headers()
      mockHeaders.set('ETag', 'etag-123')
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: async () => mockResponse,
      } as Response)

      await apiClient.get('/test', {
        cacheKey: 'test-cache',
      })

      expect(cacheSet).toHaveBeenCalledWith(
        'test-cache',
        expect.objectContaining({
          data: mockResponse,
          etag: 'etag-123',
        })
      )
    })
  })

  describe('post', () => {
    it('should make POST request with data', async () => {
      const requestData = { name: 'test' }
      const mockResponse = { id: '123' }
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockResponse,
      } as Response)

      const result = await apiClient.post('/test', requestData)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('patch', () => {
    it('should make PATCH request with data', async () => {
      const requestData = { name: 'updated' }
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      } as Response)

      await apiClient.patch('/test', requestData)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestData),
        })
      )
    })
  })

  describe('put', () => {
    it('should make PUT request with data', async () => {
      const requestData = { name: 'replaced' }
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      } as Response)

      await apiClient.put('/test', requestData)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestData),
        })
      )
    })
  })

  describe('delete', () => {
    it('should make DELETE request', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      } as Response)

      await apiClient.delete('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should throw APIError on 401 Unauthorized', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)

      await expect(apiClient.get('/test')).rejects.toThrow(APIError)
      await expect(apiClient.get('/test')).rejects.toThrow('Unauthorized')
    })

    it('should classify network errors correctly', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new TypeError('Network error'))

      try {
        await apiClient.get('/test', { retries: 0 })
      } catch (error) {
        expect(error).toBeInstanceOf(APIError)
        expect((error as APIError).type).toBe(APIErrorType.NETWORK)
      }
    })

    it('should classify timeout errors correctly', async () => {
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      vi.mocked(global.fetch).mockRejectedValue(abortError)

      try {
        await apiClient.get('/test', { retries: 0, timeout: 100 })
      } catch (error) {
        expect(error).toBeInstanceOf(APIError)
        expect((error as APIError).type).toBe(APIErrorType.TIMEOUT)
      }
    })

    it('should classify server errors correctly', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        json: async () => ({}),
      } as Response)

      try {
        await apiClient.get('/test', { retries: 0 })
      } catch (error) {
        expect(error).toBeInstanceOf(APIError)
        expect((error as APIError).type).toBe(APIErrorType.SERVER_ERROR)
        expect((error as APIError).statusCode).toBe(500)
      }
    })
  })

  describe('Retry Logic', () => {
    it('should retry on server errors', async () => {
      let attemptCount = 0
      vi.mocked(global.fetch).mockImplementation(async () => {
        attemptCount++
        if (attemptCount < 2) {
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            headers: new Headers(),
            json: async () => ({}),
          } as Response
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ success: true }),
        } as Response
      })

      const result = await apiClient.get('/test', { retries: 2 })

      expect(attemptCount).toBe(2)
      expect(result).toEqual({ success: true })
    })

    it('should not retry on client errors (4xx)', async () => {
      let attemptCount = 0
      vi.mocked(global.fetch).mockImplementation(async () => {
        attemptCount++
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          headers: new Headers(),
          json: async () => ({}),
        } as Response
      })

      await expect(apiClient.get('/test', { retries: 2 })).rejects.toThrow()
      expect(attemptCount).toBe(1)
    })

    it('should retry on rate limit (429)', async () => {
      let attemptCount = 0
      vi.mocked(global.fetch).mockImplementation(async () => {
        attemptCount++
        if (attemptCount < 2) {
          return {
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
            headers: new Headers(),
            json: async () => ({}),
          } as Response
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ success: true }),
        } as Response
      })

      const result = await apiClient.get('/test', { retries: 2 })

      expect(attemptCount).toBe(2)
      expect(result).toEqual({ success: true })
    })
  })

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after failures', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        json: async () => ({}),
      } as Response)

      // Trigger failures
      for (let i = 0; i < 5; i++) {
        try {
          await apiClient.get('/test', { retries: 0 })
        } catch {
          // Expected to fail
        }
      }

      // Next request should be blocked
      await expect(apiClient.get('/test', { retries: 0 })).rejects.toThrow('circuit breaker open')
    })

    it('should reset circuit breaker', () => {
      apiClient.resetCircuitBreaker()
      // Circuit breaker should be reset
      expect(() => { apiClient.resetCircuitBreaker(); }).not.toThrow()
    })
  })

  describe('Request Deduplication', () => {
    it('should deduplicate concurrent requests', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ data: 'test' }),
      } as Response)

      const promises = [apiClient.get('/test'), apiClient.get('/test'), apiClient.get('/test')]

      const results = await Promise.all(promises)

      // Should only call fetch once
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(results).toEqual([{ data: 'test' }, { data: 'test' }, { data: 'test' }])
    })
  })

  describe('ETag Support', () => {
    it('should include If-None-Match header when etag provided', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      } as Response)

      await apiClient.get('/test', { etag: 'etag-123' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'If-None-Match': 'etag-123',
          }),
        })
      )
    })

    it('should return cached data on 304 Not Modified', async () => {
      const cachedData = { data: 'cached' }
      vi.mocked(cacheGet).mockResolvedValue({
        data: cachedData,
        etag: 'etag-123',
        timestamp: Date.now(),
      })
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 304,
        statusText: 'Not Modified',
        headers: new Headers(),
        json: async () => ({}),
      } as Response)

      const result = await apiClient.get('/test', {
        cacheKey: 'test-cache',
        etag: 'etag-123',
      })

      expect(result).toEqual(cachedData)
    })
  })

  describe('Telemetry', () => {
    it('should track performance for successful requests', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      } as Response)

      await apiClient.get('/test')

      expect(telemetry.track).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'api_request',
          metadata: expect.objectContaining({
            endpoint: '/test',
            method: 'GET',
            statusCode: 200,
          }),
        })
      )
    })
  })

  describe('matchingApi', () => {
    it('should call getAvailablePets with query params', async () => {
      const mockResponse = {
        pets: [],
        total: 0,
      }
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockResponse,
      } as Response)

      await matchingApi.getAvailablePets({ limit: 20, cursor: 'cursor-123' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/matching/available'),
        expect.any(Object)
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=20'),
        expect.any(Object)
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('cursor=cursor-123'),
        expect.any(Object)
      )
    })

    it('should return typed response', async () => {
      const mockResponse: {
        pets: Array<{
          id: string
          ownerId: string
          species: string
          breedId: string
          breedName: string
          name: string
          sex: string
          neuterStatus: string
          dateOfBirth: string
          ageMonths: number
          lifeStage: string
          size: string
          weightKg: number
          intents: string[]
          location: {
            geohash: string
            roundedLat: number
            roundedLng: number
            city: string
            country: string
            timezone: string
          }
          media: Array<{ url: string; type: string }>
        }>
        nextCursor?: string
        total: number
      } = {
        pets: [
          {
            id: 'pet-1',
            ownerId: 'owner-1',
            species: 'dog',
            breedId: 'breed-1',
            breedName: 'Golden Retriever',
            name: 'Buddy',
            sex: 'male',
            neuterStatus: 'neutered',
            dateOfBirth: '2020-01-01',
            ageMonths: 48,
            lifeStage: 'adult',
            size: 'large',
            weightKg: 30,
            intents: ['adoption'],
            location: {
              geohash: 'hash',
              roundedLat: 40.7128,
              roundedLng: -74.006,
              city: 'New York',
              country: 'US',
              timezone: 'America/New_York',
            },
            media: [{ url: 'image.jpg', type: 'image' }],
          },
        ],
        total: 1,
      }

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockResponse,
      } as Response)

      const result = await matchingApi.getAvailablePets()

      expect(result).toEqual(mockResponse)
      expect(result.pets).toHaveLength(1)
      expect(result.pets[0]?.id).toBe('pet-1')
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      apiClient.destroy()
      // Should not throw
      expect(() => { apiClient.destroy(); }).not.toThrow()
    })
  })
})
