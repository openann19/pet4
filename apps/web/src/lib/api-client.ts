import type { Environment } from '@/config/env'
import { ENV } from '@/config/env'
import { createLogger } from '@/lib/logger'
import { retry } from '@/lib/retry'
import { ENDPOINTS } from '@/lib/endpoints'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('APIClient')

export interface PaginatedResponse {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface APIResponse<T = unknown> {
  data: T
  message?: string
  errors?: string[]
  pagination?: PaginatedResponse
}

export interface APIErrorDetails {
  message?: string
  code?: string
  details?: Record<string, unknown>
}

export interface APIError extends Error {
  status: number
  code?: string
  details?: Record<string, unknown>
}

export class APIClientError extends Error implements APIError {
  status: number
  code?: string
  details?: Record<string, unknown>

  constructor(
    message: string,
    init: { status: number; code?: string; details?: Record<string, unknown>; cause?: unknown },
  ) {
    super(message, init.cause ? { cause: init.cause } : undefined)
    this.name = 'APIClientError'
    this.status = init.status
    if (init.code !== undefined) {
      this.code = init.code
    }
    if (init.details !== undefined) {
      this.details = init.details
    }
  }
}

export class NetworkError extends Error {
  readonly status = 0
  readonly code = 'NETWORK_UNREACHABLE'
  readonly url: string
  readonly method: string
  readonly isNetworkError = true as const

  constructor(message: string, options: { url: string; method: string; cause?: unknown }) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'NetworkError'
    this.url = options.url
    this.method = options.method
  }
}

export interface RetryConfig {
  attempts: number
  delay: number
  exponentialBackoff?: boolean
}

export interface RequestConfig extends RequestInit {
  timeout?: number
  retry?: RetryConfig
  idempotent?: boolean
}

type RequestHeaders = Record<string, string>

interface StoredTokens {
  accessToken: string
  refreshToken?: string
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  attempts: 3,
  delay: 1000,
  exponentialBackoff: true
}

class APIClientImpl {
  private readonly baseUrl: string
  private readonly timeout: number
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private refreshPromise: Promise<void> | null = null

  constructor(config: Environment) {
    this.baseUrl = config.VITE_API_URL
    this.timeout = config.VITE_API_TIMEOUT

    // Load stored tokens
    this.loadTokens()
  }

  private static readonly ACCESS_TOKEN_KEY = 'access_token'
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token'

  private loadTokens(): void {
    try {
      this.accessToken = localStorage.getItem(APIClientImpl.ACCESS_TOKEN_KEY)
      this.refreshToken = localStorage.getItem(APIClientImpl.REFRESH_TOKEN_KEY)
    } catch (error) {
      logger.warn('Failed to load tokens from storage', { error })
    }
  }

  private saveTokens(tokens: StoredTokens): void {
    const { accessToken, refreshToken } = tokens

    try {
      this.accessToken = accessToken
      localStorage.setItem(APIClientImpl.ACCESS_TOKEN_KEY, accessToken)

      if (isTruthy(refreshToken)) {
        this.refreshToken = refreshToken
        localStorage.setItem(APIClientImpl.REFRESH_TOKEN_KEY, refreshToken)
      }
    } catch (error) {
      logger.error('Failed to persist auth tokens', { error })
    }
  }

  private clearTokens(): void {
    this.accessToken = null
    this.refreshToken = null

    localStorage.removeItem(APIClientImpl.ACCESS_TOKEN_KEY)
    localStorage.removeItem(APIClientImpl.REFRESH_TOKEN_KEY)
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    if (isTruthy(this.refreshPromise)) {
      await this.refreshPromise
      return
    }

    this.refreshPromise = this.performTokenRefresh()

    try {
      await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  private async performTokenRefresh(): Promise<void> {
    const response = await fetch(`${String(this.baseUrl ?? '')}${String(ENDPOINTS.AUTH.REFRESH ?? '')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    })

    if (!response.ok) {
      this.clearTokens()
      throw await this.createAPIError(response)
    }

    const data: { accessToken: string; refreshToken?: string } = await response.json()
    this.saveTokens({ 
      accessToken: data.accessToken, 
      ...(data.refreshToken ? { refreshToken: data.refreshToken } : {})
    })
  }

  private async makeRequest<T>(endpoint: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    const {
      timeout = this.timeout,
      retry: retryConfig = DEFAULT_RETRY_CONFIG,
      idempotent = false,
      ...requestInit
    } = config

    const retryConfigResolved: RetryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...retryConfig
    }

    const executeRequest = async (): Promise<APIResponse<T>> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => { controller.abort(); }, timeout)

      try {
        const requestHeaders = this.prepareHeaders(requestInit.headers)
        const response = await fetch(`${String(this.baseUrl ?? '')}${String(endpoint ?? '')}`, {
          ...requestInit,
          headers: requestHeaders,
          signal: controller.signal
        })

        if (response.status === 401 && this.refreshToken) {
          await this.handleUnauthorized()

          const retryResponse = await fetch(`${String(this.baseUrl ?? '')}${String(endpoint ?? '')}`, {
            ...requestInit,
            headers: this.prepareHeaders(requestInit.headers),
            signal: controller.signal
          })

          await this.ensureSuccessfulResponse(retryResponse)
          return retryResponse.json() as Promise<APIResponse<T>>
        }

        await this.ensureSuccessfulResponse(response)
        return response.json() as Promise<APIResponse<T>>
      } catch (error) {
        throw this.normaliseRequestError(error, endpoint, (requestInit.method ?? 'GET').toString())
      } finally {
        clearTimeout(timeoutId)
      }
    }

    if (isTruthy(idempotent)) {
      return retry(executeRequest, retryConfigResolved)
    }

    return executeRequest()
  }

  private prepareHeaders(headers?: HeadersInit): RequestHeaders {
    const merged: RequestHeaders = {
      'Content-Type': 'application/json',
      ...(headers as RequestHeaders | undefined)
    }

    if (isTruthy(this.accessToken)) {
      merged['Authorization'] = `Bearer ${String(this.accessToken ?? '')}`
    }

    return merged
  }

  private async ensureSuccessfulResponse(response: Response): Promise<void> {
    if (!response.ok) {
      throw await this.createAPIError(response)
    }
  }

  private async handleUnauthorized(): Promise<void> {
    try {
      await this.refreshAccessToken()
    } catch (error) {
      logger.warn('Token refresh failed, clearing session', { error })
      this.clearTokens()
      throw error
    }
  }

  private async parseErrorDetails(response: Response): Promise<APIErrorDetails> {
    try {
      return await response.json()
    } catch (error) {
      logger.debug('Failed to parse error body as JSON', { error })
      return { message: response.statusText }
    }
  }

  private async createAPIError(response: Response): Promise<APIClientError> {
    const errorDetails = await this.parseErrorDetails(response)

    return new APIClientError(errorDetails.message || `HTTP ${String(response.status ?? '')}`, {
      status: response.status,
      ...(errorDetails.code ? { code: errorDetails.code } : {}),
      ...(errorDetails.details ? { details: errorDetails.details } : {}),
    })
  }

  private normaliseRequestError(error: unknown, endpoint: string, method: string): Error {
    if (error instanceof NetworkError) {
      return error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new NetworkError('Request timed out while contacting backend service', {
          url: endpoint,
          method,
          cause: error,
        })
      }

      if (error instanceof TypeError) {
        return new NetworkError('Unable to reach backend service', {
          url: endpoint,
          method,
          cause: error,
        })
      }

      return error
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = String((error as { message: unknown }).message)
      return new NetworkError(message, { url: endpoint, method, cause: error })
    }

    return new NetworkError('Network request failed', { url: endpoint, method, cause: error })
  }

  // Public API methods
  async get<T>(endpoint: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'GET',
      idempotent: true,
      ...config
    })
  }

  async post<T>(endpoint: string, data?: unknown, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      ...(data ? { body: JSON.stringify(data) } : {}),
      ...config
    })
  }

  async put<T>(endpoint: string, data?: unknown, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      ...(data ? { body: JSON.stringify(data) } : {}),
      idempotent: true,
      ...config
    })
  }

  async patch<T>(endpoint: string, data?: unknown, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      ...(data ? { body: JSON.stringify(data) } : {}),
      ...config
    })
  }

  async delete<T>(endpoint: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
      idempotent: true,
      ...config
    })
  }

  // Authentication methods
  setTokens(accessToken: string, refreshToken?: string): void {
    this.saveTokens({ 
      accessToken, 
      ...(refreshToken ? { refreshToken } : {})
    })
  }

  logout(): void {
    this.clearTokens()
  }

  isAuthenticated(): boolean {
    return Boolean(this.accessToken)
  }
}

export const APIClient = new APIClientImpl(ENV)
export type { APIClientImpl }
