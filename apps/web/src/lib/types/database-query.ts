/**
 * Type definitions for database query operators
 */

/**
 * Query operator for database filtering
 */
export interface QueryOperator<T = unknown> {
  $in?: T[]
  $gt?: T
  $lt?: T
  $gte?: T
  $lte?: T
  $ne?: T
}

/**
 * Query filter value - can be a direct value or an operator object
 */
export type QueryFilterValue<T = unknown> = T | QueryOperator<T>

/**
 * Query filter object - maps field names to filter values
 */
export type QueryFilter<T extends Record<string, unknown>> = {
  [K in keyof T]?: QueryFilterValue<T[K]>
}

/**
 * Type guard to check if a value is a query operator
 */
export function isQueryOperator<T>(value: unknown): value is QueryOperator<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    ('$in' in value ||
      '$gt' in value ||
      '$lt' in value ||
      '$gte' in value ||
      '$lte' in value ||
      '$ne' in value)
  )
}

