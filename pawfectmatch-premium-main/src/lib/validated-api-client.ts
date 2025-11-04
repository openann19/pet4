import type { z } from 'zod'
import { config } from './config'
import { generateCorrelationId } from './utils'
import { apiErrorSchema, type APIError } from './api-schemas'
import { createLogger } from './logger'

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodIssue[],
    public readonly correlationId: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class APIResponseError extends Error {
  constructor(
    message: string,
    public readonly error: APIError,
    public readonly correlationId: string
  ) {
    super(message)
    this.name = 'APIResponseError'
  }
}

export interface RequestConfig extends RequestInit {
  skipValidation?: boolean
  timeout?: number
}

export class ValidatedAPIClient {
  private baseURL: string
  private accessToken: string | null = null
  private defaultTimeout = 30000

  constructor() {
    this.baseURL = config.current.API_BASE_URL
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  setBaseURL(url: string) {
    this.baseURL = url
  }

  private async validateResponse<T>(
    data: unknown,
    schema: z.ZodType<T>,
    correlationId: string,
    skipValidation: boolean = false
  ): Promise<T> {
    if (skipValidation) {
      return data as T
    }

    const result = schema.safeParse(data)

    if (!result.success) {
      const logger = createLogger('ValidatedAPIClient')
      logger.error('API validation error', new ValidationError('API response validation failed', result.error.errors, correlationId), {
        correlationId,
        errors: result.error.errors,
        data
      })

      throw new ValidationError(
        'API response validation failed',
        result.error.errors,
        correlationId
      )
    }

    return result.data
  }

  private async request<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    options: RequestConfig = {}
  ): Promise<T> {
    const correlationId = generateCorrelationId()
    const url = `${this.baseURL}${endpoint}`
    const timeout = options.timeout || this.defaultTimeout

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      'X-Client-Version': '1.0.0',
      'X-Platform': typeof window !== 'undefined' ? 'web' : 'unknown',
      ...options.headers
    }

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorData: unknown
        
        try {
          errorData = await response.json()
        } catch {
          errorData = {
            code: `HTTP_${response.status}`,
            message: response.statusText || 'Request failed',
            correlationId,
            timestamp: new Date().toISOString()
          }
        }

        const errorResult = apiErrorSchema.safeParse(errorData)
        
        if (errorResult.success) {
          throw new APIResponseError(
            errorResult.data.message,
            errorResult.data,
            correlationId
          )
        }

        throw new APIResponseError(
          'API request failed',
          {
            code: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred',
            correlationId,
            timestamp: new Date().toISOString(),
            details: errorData
          },
          correlationId
        )
      }

      if (response.status === 204) {
        return undefined as T
      }

      const data = await response.json()

      return await this.validateResponse(
        data,
        schema,
        correlationId,
        options.skipValidation
      )
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof ValidationError || error instanceof APIResponseError) {
        throw error
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIResponseError(
          'Request timeout',
          {
            code: 'REQUEST_TIMEOUT',
            message: `Request timed out after ${timeout}ms`,
            correlationId,
            timestamp: new Date().toISOString()
          },
          correlationId
        )
      }

      throw new APIResponseError(
        'Network request failed',
        {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
          details: error,
          correlationId,
          timestamp: new Date().toISOString()
        },
        correlationId
      )
    }
  }

  async get<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    options?: RequestConfig
  ): Promise<T> {
    return this.request(endpoint, schema, { 
      ...options, 
      method: 'GET' 
    })
  }

  async post<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    data?: unknown,
    options?: RequestConfig
  ): Promise<T> {
    return this.request(endpoint, schema, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async patch<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    data: unknown,
    options?: RequestConfig
  ): Promise<T> {
    return this.request(endpoint, schema, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async put<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    data: unknown,
    options?: RequestConfig
  ): Promise<T> {
    return this.request(endpoint, schema, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    options?: RequestConfig
  ): Promise<T> {
    return this.request(endpoint, schema, { 
      ...options, 
      method: 'DELETE' 
    })
  }
}

export const validatedAPI = new ValidatedAPIClient()

export function handleAPIError(error: unknown): string {
  if (error instanceof APIResponseError) {
    return error.error.message
  }

  if (error instanceof ValidationError) {
    const firstError = error.errors[0]
    if (firstError) {
      return `Validation error: ${firstError.path.join('.')} - ${firstError.message}`
    }
    return 'Response validation failed'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

export function getErrorDetails(error: unknown): {
  message: string
  code?: string
  correlationId?: string
  details?: unknown
} {
  if (error instanceof APIResponseError) {
    return {
      message: error.error.message,
      code: error.error.code,
      correlationId: error.error.correlationId,
      details: error.error.details
    }
  }

  if (error instanceof ValidationError) {
    return {
      message: error.message,
      code: 'VALIDATION_ERROR',
      correlationId: error.correlationId,
      details: error.errors
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR'
    }
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  }
}
