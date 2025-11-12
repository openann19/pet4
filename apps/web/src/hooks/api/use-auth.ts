/**
 * React Query hooks for auth API (Web)
 * Location: apps/web/src/hooks/api/use-auth.ts
 */

import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { authAPI } from '@/lib/api-services';
import type { User } from '@/hooks/api/use-user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * Hook to login
 */
export function useLogin(): UseMutationResult<AuthResponse, unknown, LoginCredentials, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authAPI.login(credentials.email, credentials.password),
    onSuccess: (data) => {
      // Set user data in cache
      queryClient.setQueryData(queryKeys.user.profile, data.user);
      // Invalidate user-related queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.pets });
    },
  });
}

/**
 * Hook to signup
 */
export function useSignup(): UseMutationResult<AuthResponse, unknown, SignupData, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignupData) => authAPI.signup(data),
    onSuccess: (data) => {
      // Set user data in cache
      queryClient.setQueryData(queryKeys.user.profile, data.user);
      // Invalidate user-related queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.pets });
    },
  });
}

/**
 * Hook to logout
 */
export function useLogout(): UseMutationResult<{ success: boolean }, unknown, void, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });
}

/**
 * Hook to refresh access token
 */
export function useRefreshToken(): UseMutationResult<
  { accessToken: string; refreshToken: string },
  unknown,
  string
> {
  return useMutation({
    mutationFn: (refreshToken: string) => authAPI.refreshToken(refreshToken),
    // Note: Token refresh typically doesn't invalidate queries
    // The token is stored separately (e.g., in localStorage or httpOnly cookie)
  });
}
