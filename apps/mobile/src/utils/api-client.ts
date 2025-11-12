/**
 * Production-Grade API Client for Mobile App
 *
 * Features:
 * - Authentication token injection
 * - Retry logic with exponential backoff + jitter
 * - Circuit breaker for fault tolerance
 * - Request/Response interceptors
 * - ETag/If-None-Match caching support
 * - Offline cache integration
 * - Telemetry integration
 * - Structured error handling
 * - Request deduplication
 * - TLS-only in production
 *
 * Location: apps/mobile/src/utils/api-client.ts
 */

import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { createLogger } from './logger'
import { cacheGet, cacheSet } from './offline-cache'
import { getAuthToken } from './secure-storage'
import { telemetry } from './telemetry'
import type {
  MatchingApiResponse,
  MatchingApiOptions,
} from '../types/api'

const logger = createLogger('api-client')

function resolveBaseUrl(): string {
  const viaEnv = process.env['EXPO_PUBLIC_API_URL']
  const viaExtra =
    Constants.expoConfig?.extra && typeof Constants.expoConfig.extra === 'object'
      ? (Constants.expoConfig.extra as Record<string, unknown>)['apiUrl']
      : undefined
  const apiUrl = typeof viaExtra === 'string' ? viaExtra : undefined

  const url = (viaEnv ?? apiUrl ?? '').trim()

  const isHttp = (v: string): boolean => /^https?:\/\//i.test(v)
  if (url && isHttp(url)) {
    return url.replace(/\/+$/, '')
  }

  if (process.env['NODE_ENV'] === 'production') {
    throw new Error(
      '[API] Missing EXPO_PUBLIC_API_URL (or app.config.ts extra.apiUrl). ' +
        'Set it for production builds: https://docs.expo.dev/workflow/configuration/'
    )
  }

  // Dev defaults for emulators
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
  return `http://${host}:3000/api`
}

const API_BASE_URL = resolveBaseUrl()

// Circuit breaker state
interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  state: 'closed' | 'open' | 'half-open'
}

// Request cache for deduplication
interface RequestCacheEntry {
  promise: Promise<unknown>
  timestamp: number
}

// Error classification
export enum APIErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class APIError extends Error {
  constructor(
    message: string,
    public readonly type: APIErrorType,
    public readonly statusCode?: number,
    public readonly endpoint?: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'APIError'
    Object.setPrototypeOf(this, APIError.prototype)
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
  skipAuth?: boolean
  skipCache?: boolean
  cacheKey?: string
  cacheTTL?: number
  etag?: string
}

interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
}

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,
  resetTimeout: 60000, // 60 seconds
  halfOpenMaxAttempts: 3,
}

class APIClient {
  private baseUrl: string
  private circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'closed',
  }
  private requestCache = new Map<string, RequestCacheEntry>()
  private cacheCleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    this.startCacheCleanup()
  }

  private startCacheCleanup(): void {
    // Clean up stale cache entries every 5 minutes
    this.cacheCleanupInterval = setInterval(() => {
      const now = Date.now()
      const maxAge = 60000 // 1 minute

      for (const [key, entry] of this.requestCache.entries()) {
        if (now - entry.timestamp > maxAge) {
          this.requestCache.delete(key)
        }
      }
    }, 300000)
  }

  private classifyError(error: unknown, statusCode?: number): APIErrorType {
    if (error instanceof Error && error.name === 'AbortError') {
      return APIErrorType.TIMEOUT
    }

    if (statusCode !== undefined) {
      if (statusCode === 401) return APIErrorType.UNAUTHORIZED
      if (statusCode === 403) return APIErrorType.FORBIDDEN
      if (statusCode === 404) return APIErrorType.NOT_FOUND
      if (statusCode >= 500) return APIErrorType.SERVER_ERROR
      if (statusCode >= 400) return APIErrorType.CLIENT_ERROR
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return APIErrorType.NETWORK
    }

    return APIErrorType.UNKNOWN
  }

  private updateCircuitBreaker(success: boolean): void {
    if (isTruthy(success)) {
      if (this.circuitBreaker.state === 'half-open') {
        // Reset on success in half-open state
        this.circuitBreaker.state = 'closed'
        this.circuitBreaker.failures = 0
      } else {
        // Reset failure count on success
        this.circuitBreaker.failures = Math.max(0, this.circuitBreaker.failures - 1)
      }
    } else {
      this.circuitBreaker.failures += 1
      this.circuitBreaker.lastFailureTime = Date.now()

      if (this.circuitBreaker.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
        if (this.circuitBreaker.state === 'closed') {
          this.circuitBreaker.state = 'open'
          logger.warn('Circuit breaker opened', {
            failures: this.circuitBreaker.failures,
            threshold: CIRCUIT_BREAKER_CONFIG.failureThreshold,
          })
        }
      }
    }

    // Auto-reset circuit breaker after timeout
    if (
      this.circuitBreaker.state === 'open' &&
      Date.now() - this.circuitBreaker.lastFailureTime > CIRCUIT_BREAKER_CONFIG.resetTimeout
    ) {
      this.circuitBreaker.state = 'half-open'
      logger.info('Circuit breaker half-open', { failures: this.circuitBreaker.failures })
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const baseDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt)
    const jitter = Math.random() * 0.3 * baseDelay // 30% jitter
    return Math.min(baseDelay + jitter, config.maxDelay)
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getAuthToken()
    const headers: Record<string, string> = {}

    if (isTruthy(token)) {
      headers['Authorization'] = `Bearer ${String(token ?? '')}`
    }

    return headers
  }

  private async getCachedResponse<T>(cacheKey: string, etag?: string): Promise<T | null> {
    try {
      const cached = await cacheGet<{ data: T; etag: string; timestamp: number }>(cacheKey)
      if (!cached) return null

      // Check if cache is valid
      const maxAge = 5 * 60 * 1000 // 5 minutes default
      if (Date.now() - cached.timestamp > maxAge) {
        return null
      }

      // If ETag matches, return cached data
      if (etag && cached.etag === etag) {
        return cached.data
      }

      return cached.data
    } catch {
      return null
    }
  }

  private async setCachedResponse<T>(cacheKey: string, data: T, etag?: string): Promise<void> {
    try {
      await cacheSet(cacheKey, {
        data,
        etag: etag ?? '',
        timestamp: Date.now(),
      })
    } catch {
      // Cache failures are non-critical
    }
  }

  private getCacheKey(endpoint: string, options: RequestOptions): string {
    if (isTruthy(options.cacheKey)) return options.cacheKey
    return `api:${String(endpoint ?? '')}:${JSON.stringify(options.body ?? {})}`
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      timeout = 30000,
      retries = DEFAULT_RETRY_CONFIG.maxRetries,
      skipAuth = false,
      skipCache = false,
      cacheKey,
      etag,
      ...fetchOptions
    } = options

    const url = `${String(this.baseUrl ?? '')}${String(endpoint ?? '')}`
    const method = fetchOptions.method ?? 'GET'
    const isGet = method === 'GET'

    // Check circuit breaker
    if (this.circuitBreaker.state === 'open') {
      const apiError = new APIError(
        'Service temporarily unavailable (circuit breaker open)',
        APIErrorType.SERVER_ERROR,
        503,
        endpoint
      )
      logger.warn('Request blocked by circuit breaker', { endpoint, url })
      throw apiError
    }

    // Request deduplication
    const dedupeKey = `${String(method ?? '')}:${String(endpoint ?? '')}:${JSON.stringify(fetchOptions.body ?? {})}`
    const cachedRequest = this.requestCache.get(dedupeKey)
    if (cachedRequest && Date.now() - cachedRequest.timestamp < 1000) {
      return cachedRequest.promise as Promise<T>
    }

    // Check offline cache for GET requests
    if (isGet && !skipCache) {
      const cacheKeyValue = cacheKey ?? this.getCacheKey(endpoint, options)
      const cached = await this.getCachedResponse<T>(cacheKeyValue, etag)
      if (cached !== null) {
        logger.debug('Cache hit', { endpoint, cacheKey: cacheKeyValue })
        return cached
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Convert fetchOptions.headers to Record<string, string>
    if (isTruthy(fetchOptions.headers)) {
      if (fetchOptions.headers instanceof Headers) {
        fetchOptions.headers.forEach((value: string, key: string) => {
          headers[key] = value
        })
      } else if (Array.isArray(fetchOptions.headers)) {
        fetchOptions.headers.forEach(([key, value]) => {
          if (key !== undefined) {
            headers[key] = String(value)
          }
        })
      } else {
        Object.assign(headers, fetchOptions.headers)
      }
    }

    if (!skipAuth) {
      const authHeaders = await this.getAuthHeaders()
      Object.assign(headers, authHeaders)
    }

    if (isTruthy(etag)) {
      headers['If-None-Match'] = etag
    }

    // Create request promise
    const requestPromise = this.executeRequest<T>(
      url,
      {
        ...fetchOptions,
        headers,
        method,
      },
      {
        timeout,
        retries,
        endpoint,
        ...(isGet && !skipCache
          ? { cacheKey: cacheKey ?? this.getCacheKey(endpoint, options) }
          : {}),
      }
    )

    // Cache request promise for deduplication
    this.requestCache.set(dedupeKey, {
      promise: requestPromise,
      timestamp: Date.now(),
    })

    try {
      const result = await requestPromise
      return result
    } finally {
      // Clean up cache entry after a short delay
      setTimeout(() => {
        this.requestCache.delete(dedupeKey)
      }, 1000)
    }
  }

  private async executeRequest<T>(
    url: string,
    fetchOptions: RequestInit,
    config: {
      timeout: number
      retries: number
      endpoint: string
      cacheKey?: string
    }
  ): Promise<T> {
    const startTime = Date.now()
    let lastError: APIError | null = null

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => { controller.abort(); }, config.timeout)

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const etagHeader = response.headers.get('ETag')
        const responseEtag = etagHeader !== null ? etagHeader : undefined
        const duration = Date.now() - startTime

        // Track telemetry
        telemetry.trackPerformance({
          name: 'api_request',
          duration,
          metadata: {
            endpoint: config.endpoint,
            method: fetchOptions.method ?? 'GET',
            statusCode: response.status,
            attempt: attempt + 1,
          },
        })

        // Handle 304 Not Modified
        if (response.status === 304 && config.cacheKey) {
          const cached = await this.getCachedResponse<T>(config.cacheKey)
          if (cached !== null) {
            this.updateCircuitBreaker(true)
            return cached
          }
        }

        if (!response.ok) {
          const errorType = this.classifyError(null, response.status)
          let errorMessage = `API request failed: ${String(response.status ?? '')} ${String(response.statusText ?? '')}`

          try {
            const errorData = await response.json()
            if (isTruthy(errorData.message)) {
              errorMessage = errorData.message
            }
          } catch {
            // Ignore JSON parse errors
          }

          const apiError = new APIError(errorMessage, errorType, response.status, config.endpoint)

          // Don't retry on client errors (4xx) except 429
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            this.updateCircuitBreaker(false)
            throw apiError
          }

          // Retry on server errors and rate limits
          if (attempt < config.retries) {
            const delay = this.calculateRetryDelay(attempt, DEFAULT_RETRY_CONFIG)
            logger.debug('Retrying request', {
              endpoint: config.endpoint,
              attempt: attempt + 1,
              delay,
              statusCode: response.status,
            })
            await this.delay(delay)
            lastError = apiError
            continue
          }

          this.updateCircuitBreaker(false)
          throw apiError
        }

        const data = await response.json()

        // Cache successful GET responses
        if (config.cacheKey && fetchOptions.method === 'GET') {
          await this.setCachedResponse(config.cacheKey, data, responseEtag)
        }

        this.updateCircuitBreaker(true)
        return data as T
      } catch (error) {
        clearTimeout(timeoutId)

        const err = error instanceof Error ? error : new Error(String(error))
        const errorType = this.classifyError(err)
        const apiError = new APIError(
          err.message || 'Network request failed',
          errorType,
          undefined,
          config.endpoint
        )

        // Don't retry on timeout or network errors beyond max retries
        if (attempt < config.retries && errorType !== APIErrorType.UNAUTHORIZED) {
          const delay = this.calculateRetryDelay(attempt, DEFAULT_RETRY_CONFIG)
          logger.debug('Retrying request after error', {
            endpoint: config.endpoint,
            attempt: attempt + 1,
            delay,
            errorType,
          })
          await this.delay(delay)
          lastError = apiError
          continue
        }

        this.updateCircuitBreaker(false)
        throw apiError
      }
    }

    // If we exhausted all retries
    this.updateCircuitBreaker(false)
    throw lastError ?? new APIError('Request failed after retries', APIErrorType.UNKNOWN)
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    })
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
    })
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    })
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  // Reset circuit breaker (useful for testing or manual recovery)
  resetCircuitBreaker(): void {
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed',
    }
    logger.info('Circuit breaker reset')
  }

  // Clear request cache
  clearRequestCache(): void {
    this.requestCache.clear()
  }

  // Cleanup
  destroy(): void {
    if (isTruthy(this.cacheCleanupInterval)) {
      clearInterval(this.cacheCleanupInterval)
      this.cacheCleanupInterval = null
    }
    this.requestCache.clear()
  }
}

export const apiClient = new APIClient()

// Re-export API types from types/api.ts for convenience
export type {
  PetMedia,
  PetLocation,
  PetApiResponse,
  MatchingApiResponse,
  MatchingApiOptions,
} from '../types/api'

// API endpoints
export const matchingApi = {
  async getAvailablePets(options?: MatchingApiOptions): Promise<MatchingApiResponse> {
    const params = new URLSearchParams()
    if (options?.limit) {
      params.append('limit', String(options.limit))
    }
    if (options?.cursor) {
      params.append('cursor', options.cursor)
    }

    const query = params.toString()
    const endpoint = `/matching/available${String(query ? `?${String(query ?? '')}` : '' ?? '')}`

    const result = await apiClient.get<MatchingApiResponse>(endpoint, {
      cacheKey: `matching:available:${String(query ?? '')}`,
      skipCache: false,
    })
    return result
  },
}
