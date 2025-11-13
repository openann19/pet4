/**
 * Typed Navigation Contracts
 * Single source of truth for all routes and navigation helpers
 */

import { z } from 'zod';

/**
 * View names - all available views in the app
 */
export type View = 
  | 'discover'
  | 'matches'
  | 'chat'
  | 'community'
  | 'adoption'
  | 'lost-found'
  | 'profile';

/**
 * Route configuration for each view
 * Defines required/optional params and search params
 */
export interface RouteConfig {
  view: View;
  params?: Record<string, unknown>;
  searchParams?: Record<string, string | string[] | undefined>;
}

/**
 * Zod schemas for route param validation
 */
export const routeParamSchemas = {
  chat: z.object({
    chatId: z.string().optional(),
    matchId: z.string().optional(),
  }),
  matches: z.object({
    matchId: z.string().optional(),
  }),
  profile: z.object({
    petId: z.string().optional(),
    userId: z.string().optional(),
  }),
  adoption: z.object({
    petId: z.string().optional(),
    listingId: z.string().optional(),
  }),
  'lost-found': z.object({
    postId: z.string().optional(),
  }),
  discover: z.object({
    petId: z.string().optional(),
  }),
  community: z.object({
    postId: z.string().optional(),
    userId: z.string().optional(),
  }),
} as const;

/**
 * Type-safe navigation helpers
 * Use these instead of string literals for navigation
 */
export const routes = {
  /**
   * Navigate to Discover view
   */
  toDiscover: (params?: { petId?: string }): RouteConfig => ({
    view: 'discover',
    params,
  }),

  /**
   * Navigate to Matches view
   */
  toMatches: (params?: { matchId?: string }): RouteConfig => ({
    view: 'matches',
    params,
  }),

  /**
   * Navigate to Chat view
   */
  toChat: (params?: { chatId?: string; matchId?: string }): RouteConfig => ({
    view: 'chat',
    params,
  }),

  /**
   * Navigate to Community view
   */
  toCommunity: (params?: { postId?: string; userId?: string }): RouteConfig => ({
    view: 'community',
    params,
  }),

  /**
   * Navigate to Adoption view
   */
  toAdoption: (params?: { petId?: string; listingId?: string }): RouteConfig => ({
    view: 'adoption',
    params,
  }),

  /**
   * Navigate to Lost & Found view
   */
  toLostFound: (params?: { postId?: string }): RouteConfig => ({
    view: 'lost-found',
    params,
  }),

  /**
   * Navigate to Profile view
   */
  toProfile: (params?: { petId?: string; userId?: string }): RouteConfig => ({
    view: 'profile',
    params,
  }),
} as const;

/**
 * Validate route params for a given view
 * Returns validated params or throws if invalid
 */
export function validateRouteParams<T extends View>(
  view: T,
  params: unknown
): z.infer<typeof routeParamSchemas[T]> {
  const schema = routeParamSchemas[view];
  if (!schema) {
    return {} as z.infer<typeof routeParamSchemas[T]>;
  }
  return schema.parse(params);
}

/**
 * Safe route params getter with defaults
 * Returns validated params with safe defaults if validation fails
 */
export function getSafeRouteParams<T extends View>(
  view: T,
  params: unknown
): z.infer<typeof routeParamSchemas[T]> {
  try {
    return validateRouteParams(view, params);
  } catch {
    return {} as z.infer<typeof routeParamSchemas[T]>;
  }
}

/**
 * Check if a view name is valid
 */
export function isValidView(view: string): view is View {
  return [
    'discover',
    'matches',
    'chat',
    'community',
    'adoption',
    'lost-found',
    'profile',
  ].includes(view);
}

/**
 * Get default view (used for initial load or fallback)
 */
export function getDefaultView(): View {
  return 'discover';
}

