import type { ApiClientConfig, ApiResponse, RequestOptions } from './types'
import { ApiError } from './types'

export function createApiClient(config: ApiClientConfig) {
  const {
    baseUrl,
    apiKey,
    timeout = 30000,
    headers: defaultHeaders = {}
  } = config

  async function request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers: customHeaders = {},
      body,
      timeout: requestTimeout = timeout
    } = options

    const url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
      ...customHeaders
    }

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout)

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value: string, key: string) => {
        responseHeaders[key] = value
      })

      let data: T
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        data = await response.json() as T
      } else {
        data = await response.text() as unknown as T
      }

      if (!response.ok) {
        throw new ApiError(
          `API request failed: ${response.statusText}`,
          response.status,
          response.statusText,
          data
        )
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof ApiError) {
        throw error
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(
          'Request timeout',
          408,
          'Request Timeout'
        )
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0,
        'Network Error',
        error
      )
    }
  }

  return {
    get: <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'GET' }),
    
    post: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'POST', body }),
    
    put: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'PUT', body }),
    
    patch: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'PATCH', body }),
    
    delete: <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

