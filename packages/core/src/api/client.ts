import { isTruthy, isDefined } from '@/core/guards';

/**
 * Unified API Client
 * 
 * Centralized API client with:
 * - Auth refresh (401 → token refresh once)
 * - Retry/backoff for idempotent GET/PUT (0ms, 300ms, 1s)
 * - Error normalization { code, message, details }
 * - Telemetry hooks: onRequest, onResponse, onError
 */

export interface APIError {
  code: string
  message: string
  details?: Record<string, unknown>
  statusCode?: number
  correlationId?: string
}

export interface RequestConfig extends RequestInit {
  skipAuth?: boolean
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface TelemetryHooks {
  onRequest?: (request: { url: string; method: string; headers: HeadersInit }) => void
  onResponse?: (response: { url: string; status: number; duration: number }) => void
  onError?: (error: APIError) => void
}

export interface AuthConfig {
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  setAccessToken: (token: string) => void
  refreshAccessToken: () => Promise<string>
  onAuthError?: () => void
}

export interface APIClientConfig {
  baseURL: string
  timeout?: number
  defaultHeaders?: HeadersInit
  auth?: AuthConfig
  telemetry?: TelemetryHooks
}

const DEFAULT_TIMEOUT = 30000
const DEFAULT_RETRIES = 3
const RETRY_DELAYS = [0, 300, 1000] // ms

function isIdempotentMethod(method: string): boolean {
  return ['GET', 'PUT', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
}

function calculateRetryDelay(attempt: number): number {
  if (attempt < RETRY_DELAYS.length) {
    return RETRY_DELAYS[attempt] ?? 1000
  }
  // Exponential backoff for additional retries
  return Math.min(1000 * Math.pow(2, attempt - RETRY_DELAYS.length), 10000)
}

function normalizeError(
  error: unknown,
  url: string,
  statusCode?: number,
  correlationId?: string
): APIError {
  if (error instanceof Error) {
    // Try to parse structured error from response
    try {
      const parsed = JSON.parse(error.message)
      if (parsed.code && parsed.message) {
        return {
          code: parsed.code,
          message: parsed.message,
          details: parsed.details,
          statusCode,
          correlationId,
        }
      }
    } catch {
      // Not JSON, continue with error message
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      statusCode,
      correlationId,
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    statusCode,
    correlationId,
  }
}

function generateCorrelationId(): string {
  return `${String(Date.now() ?? '')}-${String(Math.random().toString(36).substring(2, 9) ?? '')}`
}

export class UnifiedAPIClient {
  private config: Required<Pick<APIClientConfig, 'baseURL' | 'timeout' | 'defaultHeaders'>> &
    Pick<APIClientConfig, 'auth' | 'telemetry'>
  private refreshTokenPromise: Promise<string> | null = null

  constructor(config: APIClientConfig) {
    this.config = {
      baseURL: config.baseURL,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      defaultHeaders: config.defaultHeaders ?? {},
      auth: config.auth,
      telemetry: config.telemetry,
    }
  }

  private async refreshAuthToken(): Promise<string> {
    if (!this.config.auth) {
      throw new Error('Auth configuration required for token refresh')
    }

    // If already refreshing, wait for that promise
    if (isTruthy(this.refreshTokenPromise)) {
      return this.refreshTokenPromise
    }

    this.refreshTokenPromise = this.config.auth
      .refreshAccessToken()
      .then((token) => {
        this.config.auth?.setAccessToken(token)
        this.refreshTokenPromise = null
        return token
      })
      .catch((error) => {
        this.refreshTokenPromise = null
        this.config.auth?.onAuthError?.()
        throw error
      })

    return this.refreshTokenPromise
  }

  private async requestWithAuth(
    url: string,
    options: RequestConfig,
    attempt: number = 0
  ): Promise<Response> {
    const headers = new Headers(this.config.defaultHeaders)
    if (isTruthy(options.headers)) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers.set(key, String(value))
      })
    }

    if (!options.skipAuth && this.config.auth) {
      let token = this.config.auth.getAccessToken()
      if (!token) {
        token = await this.refreshAuthToken()
      }
      if (isTruthy(token)) {
        headers.set('Authorization', `Bearer ${String(token ?? '')}`)
      }
    }

    const correlationId = generateCorrelationId()
    headers.set('X-Correlation-ID', correlationId)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => { controller.abort(); }, options.timeout ?? this.config.timeout)

    const startTime = Date.now()

    try {
      this.config.telemetry?.onRequest?.({
        url,
        method: options.method ?? 'GET',
        headers: Object.fromEntries(headers.entries()),
      })

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const duration = Date.now() - startTime

      this.config.telemetry?.onResponse?.({
        url,
        status: response.status,
        duration,
      })

      // Handle 401 with auth refresh
      if (response.status === 401 && this.config.auth && !options.skipAuth && attempt === 0) {
        try {
          await this.refreshAuthToken()
          // Retry once with new token
          return this.requestWithAuth(url, options, attempt + 1)
        } catch (refreshError) {
          const error = normalizeError(refreshError, url, 401, correlationId)
          this.config.telemetry?.onError?.(error)
          throw error
        }
      }

      if (!response.ok) {
        let errorData: unknown
        try {
          errorData = await response.json()
        } catch {
          errorData = await response.text()
        }

        const error = normalizeError(
          errorData instanceof Error ? errorData : new Error(String(errorData)),
          url,
          response.status,
          correlationId
        )
        this.config.telemetry?.onError?.(error)
        throw error
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)

      const apiError = normalizeError(error, url, undefined, correlationId)
      this.config.telemetry?.onError?.(apiError)

      // Retry logic for idempotent methods
      const isIdempotent = isIdempotentMethod(options.method ?? 'GET')
      const maxRetries = options.retries ?? DEFAULT_RETRIES
      const shouldRetry = isIdempotent && attempt < maxRetries

      if (shouldRetry && error instanceof Error && error.name !== 'AbortError') {
        const delay = calculateRetryDelay(attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.requestWithAuth(url, options, attempt + 1)
      }

      throw apiError
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestConfig = {}
  ): Promise<T> {
    const url = `${String(this.config.baseURL ?? '')}${String(endpoint ?? '')}`
    const response = await this.requestWithAuth(url, options)

    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        return (await response.json()) as T
      }
      return (await response.text()) as T
    } catch (error) {
      throw normalizeError(error, url, response.status)
    }
  }

  async get<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data: unknown, options: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }

  async put<T>(endpoint: string, data: unknown, options: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }

  async patch<T>(endpoint: string, data: unknown, options: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }

  async delete<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

