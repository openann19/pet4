/**
 * API response types with strict TypeScript
 * Location: src/types/api.ts
 */

export interface ApiResponse<T> {
  data: T
  status: number
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  items: T[]
  cursor?: string
  hasMore: boolean
  total?: number
}

/**
 * Type guard for API responses
 */
export function isApiResponse<T>(data: unknown): data is ApiResponse<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    'status' in data &&
    typeof (data as ApiResponse<T>).status === 'number'
  )
}

/**
 * Type guard for API errors
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as ApiError).code === 'string' &&
    typeof (error as ApiError).message === 'string'
  )
}
