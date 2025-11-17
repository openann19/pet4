/**
 * Typed Navigation Helpers for Mobile
 * Provides type-safe navigation and validation
 */

import { z } from 'zod';
import type { RootStackParamList } from './AppNavigator';
import type { RootTabParamList } from './types';

/**
 * Zod schemas for route param validation
 */
export const routeParamSchemas = {
  MainTabs: z.object({}),
  UploadAndEdit: z.object({
    onDone: z.function().optional(),
    onCancel: z.function().optional(),
  }),
  SignIn: z.object({}),
  SignUp: z.object({}),
  PostComposer: z.object({
    onPostCreated: z.function().optional(),
  }).optional(),
  Feed: z.object({}),
  Chat: z.object({
    chatId: z.string().optional(),
    matchId: z.string().optional(),
  }),
  Matches: z.object({
    matchId: z.string().optional(),
  }),
  Adopt: z.object({
    petId: z.string().optional(),
    listingId: z.string().optional(),
  }),
  Community: z.object({
    postId: z.string().optional(),
    userId: z.string().optional(),
  }),
  Profile: z.object({
    petId: z.string().optional(),
    userId: z.string().optional(),
  }),
} as const;

/**
 * Type-safe navigation helpers for RootStackParamList
 */
export const stackRoutes = {
  toMainTabs: (): { screen: 'MainTabs'; params: RootStackParamList['MainTabs'] } => ({
    screen: 'MainTabs',
    params: undefined,
  }),

  toUploadAndEdit: (
    params: RootStackParamList['UploadAndEdit']
  ): { screen: 'UploadAndEdit'; params: RootStackParamList['UploadAndEdit'] } => ({
    screen: 'UploadAndEdit',
    params,
  }),

  toSignIn: (): { screen: 'SignIn'; params: RootStackParamList['SignIn'] } => ({
    screen: 'SignIn',
    params: undefined,
  }),

  toSignUp: (): { screen: 'SignUp'; params: RootStackParamList['SignUp'] } => ({
    screen: 'SignUp',
    params: undefined,
  }),

  toPostComposer: (
    params?: RootStackParamList['PostComposer']
  ): { screen: 'PostComposer'; params: RootStackParamList['PostComposer'] } => ({
    screen: 'PostComposer',
    params,
  }),
} as const;

/**
 * Type-safe navigation helpers for RootTabParamList
 */
export const tabRoutes = {
  toFeed: (): { screen: 'Feed'; params: RootTabParamList['Feed'] } => ({
    screen: 'Feed',
    params: undefined,
  }),

  toChat: (
    params?: RootTabParamList['Chat']
  ): { screen: 'Chat'; params: RootTabParamList['Chat'] } => ({
    screen: 'Chat',
    params,
  }),

  toMatches: (
    params?: RootTabParamList['Matches']
  ): { screen: 'Matches'; params: RootTabParamList['Matches'] } => ({
    screen: 'Matches',
    params,
  }),

  toAdopt: (
    params?: RootTabParamList['Adopt']
  ): { screen: 'Adopt'; params: RootTabParamList['Adopt'] } => ({
    screen: 'Adopt',
    params,
  }),

  toCommunity: (
    params?: RootTabParamList['Community']
  ): { screen: 'Community'; params: RootTabParamList['Community'] } => ({
    screen: 'Community',
    params,
  }),

  toProfile: (
    params?: RootTabParamList['Profile']
  ): { screen: 'Profile'; params: RootTabParamList['Profile'] } => ({
    screen: 'Profile',
    params,
  }),
} as const;

/**
 * Validate route params for a given screen
 * Returns validated params or throws if invalid
 */
export function validateRouteParams<T extends keyof typeof routeParamSchemas>(
  screen: T,
  params: unknown
): z.infer<typeof routeParamSchemas[T]> {
  const schema = routeParamSchemas[screen];
  if (!schema) {
    return {} as z.infer<typeof routeParamSchemas[T]>;
  }
  return schema.parse(params);
}

/**
 * Safe route params getter with defaults
 * Returns validated params with safe defaults if validation fails
 */
export function getSafeRouteParams<T extends keyof typeof routeParamSchemas>(
  screen: T,
  params: unknown
): z.infer<typeof routeParamSchemas[T]> {
  try {
    return validateRouteParams(screen, params);
  } catch {
    return {} as z.infer<typeof routeParamSchemas[T]>;
  }
}

