import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { apiClient, endpoints } from '@/lib/api'
import type { User } from '@shared/types'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  username: string
  displayName: string
  password: string
  confirmPassword: string
}

export function useAuth() {
  const queryClient = useQueryClient()

  // Get current user
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const token = localStorage.getItem('petspark_auth_token')
      if (!token) return null

      try {
        const response = await apiClient.get(endpoints.auth.me)
        return response.data as User
      } catch (_error) {
        // Token is invalid, remove it
        localStorage.removeItem('petspark_auth_token')
        return null
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post(endpoints.auth.login, credentials)
      return response.data
    },
    onSuccess: data => {
      const { user: userData, token } = data as { user: User; token: string }
      localStorage.setItem('petspark_auth_token', token)
      queryClient.setQueryData(['auth', 'user'], userData)
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiClient.post(endpoints.auth.register, data)
      return response.data
    },
    onSuccess: data => {
      const { user: userData, token } = data as { user: User; token: string }
      localStorage.setItem('petspark_auth_token', token)
      queryClient.setQueryData(['auth', 'user'], userData)
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(endpoints.auth.logout)
    },
    onSuccess: () => {
      localStorage.removeItem('petspark_auth_token')
      queryClient.setQueryData(['auth', 'user'], null)
      queryClient.clear() // Clear all queries on logout
    },
    onError: () => {
      // Even if logout fails on server, clear local state
      localStorage.removeItem('petspark_auth_token')
      queryClient.setQueryData(['auth', 'user'], null)
      queryClient.clear()
    },
  })

  // Update user mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await apiClient.put(endpoints.users.updateProfile, data)
      return response.data as User
    },
    onSuccess: updatedUser => {
      queryClient.setQueryData(['auth', 'user'], updatedUser)
    },
  })

  // Computed values - memoized for performance
  const isAuthenticated = Boolean(user)
  const token = localStorage.getItem('petspark_auth_token')

  // Actions - memoized to prevent unnecessary re-renders
  const login = useCallback(
    (credentials: LoginCredentials) => loginMutation.mutateAsync(credentials),
    [loginMutation]
  )
  const register = useCallback(
    (data: RegisterData) => registerMutation.mutateAsync(data),
    [registerMutation]
  )
  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation])
  const updateProfile = useCallback(
    (data: Partial<User>) => updateProfileMutation.mutateAsync(data),
    [updateProfileMutation]
  )

  return {
    user: user || null,
    token,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    updateProfile,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
  }
}

// Hook to check if user is authenticated (for protected routes)
export function useRequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return { isLoading: true, isAuthenticated: false, user: null }
  }

  if (!isAuthenticated) {
    // Redirect to login page will be handled by ProtectedRoute component
    return { isLoading: false, isAuthenticated: false, user: null }
  }

  return { isLoading: false, isAuthenticated: true, user }
}
