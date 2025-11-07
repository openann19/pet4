/**
 * Type Guard Utilities
 * 
 * Centralized type guard functions for safe type narrowing from unknown.
 * All type guards follow the pattern: (value: unknown) => value is Type
 */

/**
 * Type guard for Record<string, unknown>
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Type guard for array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Type guard for string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Type guard for number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

/**
 * Type guard for boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * Type guard for function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function'
}

/**
 * Type guard for object with specific keys
 */
export function hasKeys<T extends string>(
  value: unknown,
  keys: readonly T[]
): value is Record<T, unknown> {
  if (!isRecord(value)) return false
  return keys.every(key => key in value)
}

/**
 * Type guard for PostFilters
 */
export interface PostFilters {
  status?: string[]
  species?: string[]
  tags?: string[]
  authorId?: string
  dateRange?: {
    start?: string
    end?: string
  }
}

export function isPostFilters(value: unknown): value is PostFilters {
  if (!isRecord(value)) return false
  
  if ('status' in value && !isArray(value.status)) return false
  if ('species' in value && !isArray(value.species)) return false
  if ('tags' in value && !isArray(value.tags)) return false
  if ('authorId' in value && !isString(value.authorId)) return false
  if ('dateRange' in value && !isRecord(value.dateRange)) return false
  
  return true
}

/**
 * Type guard for LostAlertFilters
 */
export interface LostAlertFilters {
  status?: string[]
  radius?: number
  species?: string[]
  location?: {
    lat: number
    lng: number
  }
}

export function isLostAlertFilters(value: unknown): value is LostAlertFilters {
  if (!isRecord(value)) return false
  
  if ('status' in value && !isArray(value.status)) return false
  if ('radius' in value && !isNumber(value.radius)) return false
  if ('species' in value && !isArray(value.species)) return false
  if ('location' in value && !isRecord(value.location)) return false
  
  return true
}

/**
 * Union type guard for filters
 */
export type Filters = PostFilters | LostAlertFilters

export function isFilters(value: unknown): value is Filters {
  return isPostFilters(value) || isLostAlertFilters(value)
}

/**
 * Type guard for action types in admin components
 */
export type ModerationAction = 'approve' | 'reject' | 'flag' | 'delete' | 'ban'

export function isModerationAction(value: unknown): value is ModerationAction {
  return (
    isString(value) &&
    (value === 'approve' || value === 'reject' || value === 'flag' || value === 'delete' || value === 'ban')
  )
}

/**
 * Type guard for Record<string, unknown> with optional keys
 */
export function isRecordWithOptionalKeys<T extends string>(
  value: unknown,
  requiredKeys: readonly T[],
  optionalKeys: readonly T[] = []
): value is Partial<Record<T, unknown>> & Record<T, unknown> {
  if (!isRecord(value)) return false
  return requiredKeys.every(key => key in value)
}

/**
 * Type guard for error objects
 */
export interface ErrorLike {
  message: string
  stack?: string
  name?: string
}

export function isErrorLike(value: unknown): value is ErrorLike {
  return (
    isRecord(value) &&
    'message' in value &&
    isString(value.message)
  )
}

/**
 * Type guard for HTTP response
 */
export interface HttpResponse<T = unknown> {
  status: number
  data: T
  headers?: Record<string, string>
}

export function isHttpResponse<T = unknown>(value: unknown): value is HttpResponse<T> {
  return (
    isRecord(value) &&
    'status' in value &&
    'data' in value &&
    isNumber(value.status)
  )
}

