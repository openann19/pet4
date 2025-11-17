import type { PostFilters } from '@/lib/community-types';

/**
 * Builds query parameters for feed queries
 */
export function buildFeedQueryParams(
  filters?: PostFilters,
  userId?: string
): Record<string, unknown> {
  const queryParams: Record<string, unknown> = {};

  if (filters?.kind && filters.kind.length > 0) {
    queryParams.kind = filters.kind;
  }

  if (filters?.authorId) {
    queryParams.authorId = filters.authorId;
  }

  if (filters?.tags && filters.tags.length > 0) {
    queryParams.tags = filters.tags;
  }

  if (filters?.location) {
    queryParams.near = `${filters.location.lat},${filters.location.lon}`;
    queryParams.radius = filters.location.radiusKm;
  }

  if (filters?.visibility && filters.visibility.length > 0) {
    queryParams.visibility = filters.visibility;
  } else if (userId) {
    queryParams.visibility = ['public', 'matches'];
  }

  if (filters?.featured) {
    queryParams.featured = filters.featured;
  }

  if (filters?.sortBy) {
    queryParams.sortBy = filters.sortBy;
  }

  if (filters?.cursor) {
    queryParams.cursor = filters.cursor;
  }

  if (filters?.limit) {
    queryParams.limit = filters.limit;
  }

  if (userId) {
    queryParams.userId = userId;
  }

  return queryParams;
}

/**
 * Builds URL with query parameters
 */
export function buildFeedUrl(
  baseUrl: string,
  queryParams: Record<string, unknown>
): string {
  if (Object.keys(queryParams).length === 0) {
    return baseUrl;
  }

  const params = new URLSearchParams(
    Object.entries(queryParams).map(([k, v]) => [k, String(v)])
  );
  return `${baseUrl}?${params.toString()}`;
}

