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
  _url?: string,
  statusCode?: number,
  correlationId?: string
): APIError {
  const errorObj: APIError = {
    code: 'UNKNOWN_ERROR',
    message: String(error),
  }

  if (statusCode !== undefined) {
    errorObj.statusCode = statusCode
  }

  if (correlationId !== undefined) {
    errorObj.correlationId = correlationId
  }

  if (error instanceof Error) {
    // Try to parse structured error from response
    try {
      const parsed: unknown = JSON.parse(error.message)
      // Type guard for structured error response
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'code' in parsed &&
        'message' in parsed &&
        typeof (parsed as { code: unknown }).code === 'string' &&
        typeof (parsed as { message: unknown }).message === 'string'
      ) {
        const structuredError = parsed as { code: string; message: string; details?: unknown }
        errorObj.code = structuredError.code
        errorObj.message = structuredError.message
        if (structuredError.details !== undefined) {
          errorObj.details = structuredError.details as Record<string, unknown>
        }
        return errorObj
      }
    } catch {
      // Not JSON, continue with error message
    }

    errorObj.message = error.message
    return errorObj
  }

  return errorObj
}

function generateCorrelationId(): string {
  // eslint-disable-next-line no-restricted-syntax -- Math.random() acceptable for correlation IDs (uniqueness only)
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export class UnifiedAPIClient {
  private readonly config: Required<Pick<APIClientConfig, 'baseURL' | 'timeout' | 'defaultHeaders'>> &
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
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise
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
    const headers = new Headers(this.config.defaultHeaders)
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers.set(key, String(value))
      })
    }

    if (options.skipAuth !== true && this.config.auth !== undefined) {
      let token = this.config.auth.getAccessToken()
      token ??= await this.refreshAuthToken()
      headers.set('Authorization', `Bearer ${token}`)
    }

    const correlationId = generateCorrelationId()
    headers.set('X-Correlation-ID', correlationId)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, options.timeout ?? this.config.timeout)

    const startTime = Date.now()

    try {
      // Convert Headers to plain object for telemetry
      const headersObj: Record<string, string> = {};
      headers.forEach((value, key) => {
        headersObj[key] = value;
      });

      this.config.telemetry?.onRequest?.({
        url,
        method: options.method ?? 'GET',
        headers: headersObj,
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
      if (response.status === 401 && this.config.auth !== undefined && options.skipAuth !== true && attempt === 0) {
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
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.requestWithAuth(url, options, attempt + 1)
      }

      throw apiError
    }
  }

  async request<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`
    const response = await this.requestWithAuth(url, options)

    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json') === true) {
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
