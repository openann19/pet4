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
 * Pet media from API
 */
export interface PetMedia {
  url: string
  type: 'photo' | 'video' | 'audio' | string
}

/**
 * Pet location from API
 */
export interface PetLocation {
  geohash: string
  roundedLat: number
  roundedLng: number
  city: string
  country: string
  timezone: string
}

/**
 * Pet profile from API (raw API response format)
 */
export interface PetApiResponse {
  id: string
  ownerId: string
  species: string
  breedId: string
  breedName: string
  name: string
  sex: string
  neuterStatus: string
  dateOfBirth: string
  ageMonths: number
  lifeStage: string
  size: string
  weightKg: number
  intents: string[]
  location: PetLocation
  media: PetMedia[]
}

/**
 * Matching API response
 */
export interface MatchingApiResponse {
  pets: PetApiResponse[]
  nextCursor?: string
  total: number
}

/**
 * Matching API options
 */
export interface MatchingApiOptions {
  limit?: number
  cursor?: string
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

/**
 * Type guard for PetApiResponse
 */
export function isPetApiResponse(data: unknown): data is PetApiResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'ownerId' in data &&
    'species' in data &&
    'breedName' in data &&
    'name' in data &&
    'media' in data &&
    Array.isArray((data as PetApiResponse).media)
  )
}

/**
 * Type guard for MatchingApiResponse
 */
export function isMatchingApiResponse(data: unknown): data is MatchingApiResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'pets' in data &&
    'total' in data &&
    Array.isArray((data as MatchingApiResponse).pets) &&
    typeof (data as MatchingApiResponse).total === 'number'
  )
}
