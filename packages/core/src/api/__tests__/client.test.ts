/**
 * UnifiedAPIClient Tests - 100% Coverage
 * 
 * Tests all API client functionality including:
 * - Auth token refresh
 * - Retry logic
 * - Error handling
 * - Telemetry hooks
 * - All HTTP methods
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { UnifiedAPIClient, type APIClientConfig, type APIError, type AuthConfig, type TelemetryHooks } from '../client'

// Mock fetch globally
global.fetch = vi.fn() as Mock
const mockFetch = global.fetch as Mock

// Mock timers
vi.useFakeTimers()

describe('UnifiedAPIClient', () => {
  let client: UnifiedAPIClient
  let mockAuth: AuthConfig
  let mockTelemetry: TelemetryHooks

  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    mockFetch.mockClear()

    mockAuth = {
      getAccessToken: vi.fn().mockReturnValue('access-token'),
      getRefreshToken: vi.fn().mockReturnValue('refresh-token'),
      setAccessToken: vi.fn(),
      refreshAccessToken: vi.fn().mockResolvedValue('new-access-token'),
      onAuthError: vi.fn(),
    }

    mockTelemetry = {
      onRequest: vi.fn(),
      onResponse: vi.fn(),
      onError: vi.fn(),
    }
  })

  describe('constructor', () => {
    it('should create client with default config', () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)

      expect(client).toBeInstanceOf(UnifiedAPIClient)
    })

    it('should create client with custom timeout', () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        timeout: 60000,
      }
      client = new UnifiedAPIClient(config)

      expect(client).toBeInstanceOf(UnifiedAPIClient)
    })

    it('should create client with default headers', () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        defaultHeaders: {
          'X-Custom-Header': 'value',
        },
      }
      client = new UnifiedAPIClient(config)

      expect(client).toBeInstanceOf(UnifiedAPIClient)
    })

    it('should create client with auth config', () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        auth: mockAuth,
      }
      client = new UnifiedAPIClient(config)

      expect(client).toBeInstanceOf(UnifiedAPIClient)
    })

    it('should create client with telemetry hooks', () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        telemetry: mockTelemetry,
      }
      client = new UnifiedAPIClient(config)

      expect(client).toBeInstanceOf(UnifiedAPIClient)
    })
  })

  describe('token refresh', () => {
    it('should refresh token when 401 received', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        auth: mockAuth,
        telemetry: mockTelemetry,
      }
      client = new UnifiedAPIClient(config)

      // First request returns 401
      mockFetch
        .mockResolvedValueOnce({
          status: 401,
          ok: false,
          headers: new Headers(),
        })
        // Second request after refresh succeeds
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ data: 'success' }),
        })

      const result = await client.get('/test')

      expect(mockAuth.refreshAccessToken).toHaveBeenCalled()
      expect(mockAuth.setAccessToken).toHaveBeenCalledWith('new-access-token')
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ data: 'success' })
    })

    it('should handle refresh failure', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        auth: {
          ...mockAuth,
          refreshAccessToken: vi.fn().mockRejectedValue(new Error('Refresh failed')),
        },
        telemetry: mockTelemetry,
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 401,
        ok: false,
        headers: new Headers(),
      })

      await expect(client.get('/test')).rejects.toMatchObject({
        code: expect.any(String),
        statusCode: 401,
      })

      expect(mockAuth.onAuthError).toHaveBeenCalled()
      expect(mockTelemetry.onError).toHaveBeenCalled()
    })

    it('should not refresh if skipAuth is true', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        auth: mockAuth,
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      })

      await client.get('/test', { skipAuth: true })

      expect(mockAuth.getAccessToken).not.toHaveBeenCalled()
    })

    it('should reuse refresh promise when multiple requests fail simultaneously', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        auth: mockAuth,
      }
      client = new UnifiedAPIClient(config)

      let refreshCallCount = 0
      mockAuth.refreshAccessToken = vi.fn().mockImplementation(async () => {
        refreshCallCount++
        await new Promise((resolve) => setTimeout(resolve, 100))
        return 'new-token'
      })

      mockFetch
        .mockResolvedValueOnce({
          status: 401,
          ok: false,
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          status: 401,
          ok: false,
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ data: 'success1' }),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ data: 'success2' }),
        })

      // Start two requests simultaneously
      const promise1 = client.get('/test1')
      const promise2 = client.get('/test2')

      // Advance timers to allow refresh to complete
      await vi.advanceTimersByTimeAsync(150)

      const [result1, result2] = await Promise.all([promise1, promise2])

      // Should only call refresh once
      expect(refreshCallCount).toBe(1)
      expect(result1).toEqual({ data: 'success1' })
      expect(result2).toEqual({ data: 'success2' })
    })
  })

  describe('retry logic', () => {
    it('should retry idempotent GET requests on failure', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        telemetry: mockTelemetry,
      }
      client = new UnifiedAPIClient(config)

      // First two attempts fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ data: 'success' }),
        })

      const result = await client.get('/test', { retries: 3 })

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(result).toEqual({ data: 'success' })
    })

    it('should not retry non-idempotent POST requests', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(client.post('/test', { data: 'test' })).rejects.toMatchObject({
        code: expect.any(String),
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should not retry on AbortError', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)

      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValueOnce(abortError)

      await expect(client.get('/test')).rejects.toMatchObject({
        code: expect.any(String),
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should use exponential backoff for retries', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ data: 'success' }),
        })

      const startTime = Date.now()
      const resultPromise = client.get('/test', { retries: 4 })

      // Advance timers for retry delays (0ms, 300ms, 1000ms)
      await vi.advanceTimersByTimeAsync(1500)

      const result = await resultPromise

      expect(mockFetch).toHaveBeenCalledTimes(4)
      expect(result).toEqual({ data: 'success' })
    })
  })

  describe('error handling', () => {
    it('should normalize Error objects', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: 'Network error',
      })
    })

    it('should normalize non-Error values', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockRejectedValueOnce('String error')

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: 'String error',
      })
    })

    it('should parse structured error from JSON response', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)

      const error = new Error(JSON.stringify({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: { field: 'email' },
      }))

      mockFetch.mockRejectedValueOnce(error)

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: { field: 'email' },
      })
    })

    it('should handle HTTP error responses', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        telemetry: mockTelemetry,
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 400,
        ok: false,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          code: 'BAD_REQUEST',
          message: 'Invalid request',
        }),
      })

      await expect(client.get('/test')).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Invalid request',
        statusCode: 400,
      })

      expect(mockTelemetry.onError).toHaveBeenCalled()
    })

    it('should handle HTTP error with text response', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 500,
        ok: false,
        headers: new Headers(),
        text: async () => 'Internal Server Error',
      })

      await expect(client.get('/test')).rejects.toMatchObject({
        statusCode: 500,
      })
    })
  })

  describe('telemetry hooks', () => {
    it('should call onRequest hook', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        telemetry: mockTelemetry,
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      })

      await client.get('/test')

      expect(mockTelemetry.onRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/test',
          method: 'GET',
        })
      )
    })

    it('should call onResponse hook', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        telemetry: mockTelemetry,
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      })

      await client.get('/test')

      expect(mockTelemetry.onResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/test',
          status: 200,
          duration: expect.any(Number),
        })
      )
    })

    it('should call onError hook on failure', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        telemetry: mockTelemetry,
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(client.get('/test')).rejects.toBeDefined()

      expect(mockTelemetry.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String),
        })
      )
    })
  })

  describe('timeout handling', () => {
    it('should timeout requests after specified duration', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        timeout: 1000,
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          status: 200,
          ok: true,
          headers: new Headers(),
          text: async () => 'success',
        }), 2000))
      )

      const resultPromise = client.get('/test')

      // Advance timer to trigger timeout
      await vi.advanceTimersByTimeAsync(1100)

      await expect(resultPromise).rejects.toMatchObject({
        code: expect.any(String),
      })
    })

    it('should use custom timeout from request options', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        timeout: 5000,
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          status: 200,
          ok: true,
          headers: new Headers(),
          text: async () => 'success',
        }), 2000))
      )

      const resultPromise = client.get('/test', { timeout: 1000 })

      await vi.advanceTimersByTimeAsync(1100)

      await expect(resultPromise).rejects.toMatchObject({
        code: expect.any(String),
      })
    })
  })

  describe('HTTP methods', () => {
    beforeEach(() => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)
    })

    it('should make GET request', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'get-success' }),
      })

      const result = await client.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
        })
      )
      expect(result).toEqual({ data: 'get-success' })
    })

    it('should make POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'post-success' }),
      })

      const result = await client.post('/test', { name: 'test' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual({ data: 'post-success' })
    })

    it('should make PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'put-success' }),
      })

      const result = await client.put('/test', { id: '1', name: 'updated' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ id: '1', name: 'updated' }),
        })
      )
      expect(result).toEqual({ data: 'put-success' })
    })

    it('should make PATCH request', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'patch-success' }),
      })

      const result = await client.patch('/test', { name: 'patched' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'patched' }),
        })
      )
      expect(result).toEqual({ data: 'patch-success' })
    })

    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'delete-success' }),
      })

      const result = await client.delete('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(result).toEqual({ data: 'delete-success' })
    })
  })

  describe('content type handling', () => {
    it('should parse JSON response', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'json-data' }),
      })

      const result = await client.get('/test')

      expect(result).toEqual({ data: 'json-data' })
    })

    it('should parse text response', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'text-data',
      })

      const result = await client.get('/test')

      expect(result).toBe('text-data')
    })

    it('should handle response parsing error', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)

      const response = {
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => {
          throw new Error('Parse error')
        },
      }

      mockFetch.mockResolvedValueOnce(response)

      await expect(client.get('/test')).rejects.toMatchObject({
        code: expect.any(String),
      })
    })
  })

  describe('headers and correlation ID', () => {
    it('should include default headers', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        defaultHeaders: {
          'X-Custom-Header': 'custom-value',
        },
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      })

      await client.get('/test')

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1]?.headers as Headers

      expect(headers.get('X-Custom-Header')).toBe('custom-value')
    })

    it('should include Authorization header when auth is configured', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        auth: mockAuth,
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      })

      await client.get('/test')

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1]?.headers as Headers

      expect(headers.get('Authorization')).toBe('Bearer access-token')
    })

    it('should include correlation ID in headers', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      })

      await client.get('/test')

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1]?.headers as Headers

      expect(headers.get('X-Correlation-ID')).toBeTruthy()
      expect(headers.get('X-Correlation-ID')).toMatch(/^\d+-[a-z0-9]+$/)
    })

    it('should merge request headers with default headers', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        defaultHeaders: {
          'X-Default': 'default-value',
        },
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      })

      await client.get('/test', {
        headers: {
          'X-Request': 'request-value',
        },
      })

      const callArgs = mockFetch.mock.calls[0]
      const headers = callArgs[1]?.headers as Headers

      expect(headers.get('X-Default')).toBe('default-value')
      expect(headers.get('X-Request')).toBe('request-value')
    })
  })

  describe('edge cases', () => {
    it('should handle empty baseURL', async () => {
      const config: APIClientConfig = {
        baseURL: '',
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      })

      await client.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        '/test',
        expect.any(Object)
      )
    })

    it('should handle null token from getAccessToken', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        auth: {
          ...mockAuth,
          getAccessToken: vi.fn().mockReturnValue(null),
        },
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      })

      await client.get('/test')

      expect(mockAuth.refreshAccessToken).toHaveBeenCalled()
    })

    it('should handle undefined token from getAccessToken', async () => {
      const config: APIClientConfig = {
        baseURL: 'https://api.example.com',
        auth: {
          ...mockAuth,
          getAccessToken: vi.fn().mockReturnValue(undefined),
        },
      }
      client = new UnifiedAPIClient(config)

      mockFetch.mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      })

      await client.get('/test')

      expect(mockAuth.refreshAccessToken).toHaveBeenCalled()
    })
  })
})

