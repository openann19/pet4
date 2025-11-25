import { isTruthy, isDefined } from '@petspark/shared'

// Web-compatible HeadersInit type
type HeadersInit = Record<string, string> | Headers | [string, string][]

type HeadersSnapshot = Record<string, string> & {
  get: (name: string) => string | null
}

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
const DEFAULT_RETRIES = 0
const RETRY_DELAYS = [0, 300, 1000] // ms
const TIMEOUT_RESULT = Symbol('api-client-timeout')
const isTestEnvironment =
  typeof process !== 'undefined' &&
  (process.env['VITEST'] !== undefined ||
    process.env['VITEST_WORKER_ID'] !== undefined ||
    process.env['NODE_ENV'] === 'test')

function isAPIError(value: unknown): value is APIError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as { code: unknown }).code === 'string' &&
    typeof (value as { message: unknown }).message === 'string'
  )
}

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

interface StructuredErrorPayload {
  code?: unknown
  message?: unknown
  details?: unknown
}

function normalizeError(
  error: unknown,
  _url?: string,
  statusCode?: number,
  correlationId?: string
): APIError {
  const baseError: APIError = {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error',
  }

  if (statusCode !== undefined) {
    baseError.statusCode = statusCode
  }

  if (correlationId !== undefined) {
    baseError.correlationId = correlationId
  }

  const assignStructuredFields = (payload: StructuredErrorPayload) => {
    if (typeof payload.code === 'string' && payload.code.trim() !== '') {
      baseError.code = payload.code
    }
    if (typeof payload.message === 'string' && payload.message.trim() !== '') {
      baseError.message = payload.message
    }
    if (payload.details && typeof payload.details === 'object') {
      baseError.details = payload.details as Record<string, unknown>
    }
  }

  if (error instanceof Error) {
    // Attempt to parse structured error from error.message if it's JSON
    try {
      const parsed = JSON.parse(error.message) as StructuredErrorPayload
      if (typeof parsed === 'object' && parsed !== null) {
        assignStructuredFields(parsed)
        return baseError
      }
    } catch {
      // Not JSON - fall through to use the error message
    }

    baseError.message = error.message
    return baseError
  }

  if (typeof error === 'object' && error !== null) {
    assignStructuredFields(error as StructuredErrorPayload)
    if (baseError.message === 'Unknown error') {
      baseError.message = JSON.stringify(error)
    }
    return baseError
  }

  if (typeof error === 'string') {
    baseError.message = error
    return baseError
  }

  baseError.message = String(error)
  return baseError
}

function generateCorrelationId(): string {
  return `${String(Date.now() ?? '')}-${String(Math.random().toString(36).substring(2, 9) ?? '')}`
}

export class UnifiedAPIClient {
  private readonly config: Required<
    Pick<APIClientConfig, 'baseURL' | 'timeout' | 'defaultHeaders'>
  > &
    Pick<APIClientConfig, 'auth' | 'telemetry'>
  private refreshTokenPromise: Promise<string> | null = null

  constructor(config: APIClientConfig) {
    const baseConfig: Required<Pick<APIClientConfig, 'baseURL' | 'timeout' | 'defaultHeaders'>> = {
      baseURL: config.baseURL,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      defaultHeaders: config.defaultHeaders ?? {},
    }

    // Build config object, only including auth/telemetry if they're defined
    if (config.auth !== undefined && config.telemetry !== undefined) {
      this.config = { ...baseConfig, auth: config.auth, telemetry: config.telemetry }
    } else if (config.auth !== undefined) {
      this.config = { ...baseConfig, auth: config.auth }
    } else if (config.telemetry !== undefined) {
      this.config = { ...baseConfig, telemetry: config.telemetry }
    } else {
      this.config = baseConfig
    }
  }

  private async refreshAuthToken(): Promise<string> {
    if (!this.config.auth) {
      throw new Error('Auth configuration required for token refresh')
    }

    // If already refreshing, wait for that promise
    if (isTruthy(this.refreshTokenPromise)) {
      return this.refreshTokenPromise!
    }

    this.refreshTokenPromise = this.config.auth
      .refreshAccessToken()
      .then(token => {
        this.config.auth?.setAccessToken(token)
        this.refreshTokenPromise = null
        return token
      })
      .catch(error => {
        this.refreshTokenPromise = null
        this.config.auth?.onAuthError?.()
        throw error
      })

    return this.refreshTokenPromise
  }

  private async requestWithAuth(
    url: string,
    options: RequestConfig,
    attempt = 0
  ): Promise<Response> {
    const headerEntries = new Map<string, { key: string; value: string }>()

    const setHeader = (key: string, value: unknown) => {
      if (!isDefined(value)) {
        return
      }
      headerEntries.set(key.toLowerCase(), { key, value: String(value) })
    }

    const applyHeaders = (input?: HeadersInit) => {
      if (!input) {
        return
      }
      if (typeof Headers !== 'undefined' && input instanceof Headers) {
        input.forEach((value: string, key: string) => setHeader(key, value))
      } else if (Array.isArray(input)) {
        input.forEach(([key, value]) => setHeader(key, value))
      } else {
        Object.entries(input).forEach(([key, value]) => setHeader(key, value))
      }
    }

    applyHeaders(this.config.defaultHeaders)
    applyHeaders(options.headers)

    if (options.skipAuth !== true && this.config.auth !== undefined) {
      let token = this.config.auth.getAccessToken()
      token ??= await this.refreshAuthToken()
      setHeader('Authorization', `Bearer ${token}`)
    }

    const correlationId = generateCorrelationId()
    setHeader('X-Correlation-ID', correlationId)

    const headersForRequest = (() => {
      const snapshot = Object.create(null) as HeadersSnapshot
      for (const { key, value } of headerEntries.values()) {
        snapshot[key] = value
      }
      Object.defineProperty(snapshot, 'get', {
        enumerable: false,
        value: (name: string) => {
          const normalized = name.toLowerCase()
          return headerEntries.get(normalized)?.value ?? null
        },
      })
      return snapshot
    })()

    const controller = new AbortController()
    const timeoutMs = options.timeout ?? this.config.timeout
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const startTime = Date.now()

    try {
      const timeoutPromise = new Promise<typeof TIMEOUT_RESULT>(resolve => {
        timeoutId = setTimeout(() => {
          controller.abort()
          resolve(TIMEOUT_RESULT)
        }, timeoutMs)
      })

      this.config.telemetry?.onRequest?.({
        url,
        method: options.method ?? 'GET',
        headers: headersForRequest,
      })

      const fetchPromise = fetch(url, {
        ...options,
        headers: headersForRequest,
        signal: controller.signal,
      })

      const guardedFetchPromise = fetchPromise.catch(error => {
        if (error instanceof Error && error.name === 'AbortError') {
          return undefined as never
        }
        throw error
      })

      const raceResult = (await Promise.race([guardedFetchPromise, timeoutPromise])) as
        | Response
        | typeof TIMEOUT_RESULT
        | undefined

      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }

      if (raceResult === TIMEOUT_RESULT) {
        const abortError = new Error('Request timeout')
        abortError.name = 'AbortError'
        throw abortError
      }

      if (!raceResult) {
        throw new Error('Network error')
      }

      const response = raceResult

      const duration = Date.now() - startTime

      this.config.telemetry?.onResponse?.({
        url,
        status: response.status,
        duration,
      })

      // Handle 401 with auth refresh
      if (
        response.status === 401 &&
        this.config.auth !== undefined &&
        options.skipAuth !== true &&
        attempt === 0
      ) {
        try {
          await this.refreshAuthToken()
          // Retry once with new token
          return await this.requestWithAuth(url, options, attempt + 1)
        } catch (refreshError) {
          const error = normalizeError(refreshError, url, 401, correlationId)
          this.config.telemetry?.onError?.(error)
          throw error
        }
      }

      if (!response.ok) {
        let errorData: unknown
        const contentType = response.headers.get('content-type') ?? ''

        if (contentType.includes('application/json')) {
          try {
            errorData = await response.json()
          } catch (parseError) {
            errorData = parseError instanceof Error ? parseError : String(parseError)
          }
        } else {
          try {
            errorData = await response.text()
          } catch (parseError) {
            errorData = parseError instanceof Error ? parseError : String(parseError)
          }
        }

        const error = normalizeError(errorData, url, response.status, correlationId)
        this.config.telemetry?.onError?.(error)
        throw error
      }

      return response
    } catch (error) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }

      const apiError: APIError = isAPIError(error)
        ? error
        : normalizeError(error, url, undefined, correlationId)
      this.config.telemetry?.onError?.(apiError)

      // Retry logic for idempotent methods
      const isIdempotent = isIdempotentMethod(options.method ?? 'GET')
      const maxRetries = options.retries ?? DEFAULT_RETRIES
      const shouldRetry = isIdempotent && attempt < maxRetries

      if (shouldRetry && error instanceof Error && error.name !== 'AbortError') {
        const delay = options.retryDelay ?? calculateRetryDelay(attempt)
        if (delay > 0 && !isTestEnvironment) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        return this.requestWithAuth(url, options, attempt + 1)
      }

      throw apiError
    }
  }

  request<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
    const execute = async () => {
      const url = `${this.config.baseURL}${endpoint}`
      let response: Response | null = null

      try {
        response = await this.requestWithAuth(url, options)
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json') === true) {
          return (await response.json()) as T
        }
        return (await response.text()) as T
      } catch (error) {
        if (isAPIError(error)) {
          if (typeof process !== 'undefined' && process.env['DEBUG_API_CLIENT'] === '1') {
            console.log('APIError caught in request:', error)
          }
          throw error
        }
        const statusCode = response?.status
        throw normalizeError(error, url, statusCode)
      }
    }

    const requestPromise = execute()
    requestPromise.catch(() => undefined)
    return requestPromise
  }

  get<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  post<T>(endpoint: string, data: unknown, options: RequestConfig = {}): Promise<T> {
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

  put<T>(endpoint: string, data: unknown, options: RequestConfig = {}): Promise<T> {
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

  patch<T>(endpoint: string, data: unknown, options: RequestConfig = {}): Promise<T> {
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

  delete<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}
