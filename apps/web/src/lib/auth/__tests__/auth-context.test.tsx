/**
 * AuthContext Tests - 100% Coverage
 * 
 * Tests all authentication flows, error handling, and edge cases
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { authApi } from '@/api/auth-api'
import { APIClient } from '@/lib/api-client'
import type { User } from '@/lib/contracts'

// Mock dependencies
vi.mock('@/api/auth-api')
vi.mock('@/lib/api-client')
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

const mockAuthApi = authApi as {
  me: Mock
  login: Mock
  register: Mock
  logout: Mock
}

const mockAPIClient = APIClient as {
  setTokens: Mock
  logout: Mock
}

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: new Date().toISOString(),
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockAPIClient.setTokens = vi.fn()
    mockAPIClient.logout = vi.fn()
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')
    })

    it('should return auth context when used inside AuthProvider', async () => {
      mockAuthApi.me = vi.fn().mockResolvedValue(mockUser)
      localStorage.setItem('access_token', 'token-123')
      localStorage.setItem('refresh_token', 'refresh-123')

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('AuthProvider initialization', () => {
    it('should initialize with no tokens', async () => {
      mockAuthApi.me = vi.fn()

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(mockAuthApi.me).not.toHaveBeenCalled()
    })

    it('should load user profile when access token exists', async () => {
      mockAuthApi.me = vi.fn().mockResolvedValue(mockUser)
      localStorage.setItem('access_token', 'token-123')
      localStorage.setItem('refresh_token', 'refresh-123')

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockAPIClient.setTokens).toHaveBeenCalledWith('token-123', 'refresh-123')
      expect(mockAuthApi.me).toHaveBeenCalled()
      expect(result.current.user).toEqual(mockUser)
    })

    it('should handle profile load failure and clear tokens', async () => {
      mockAuthApi.me = vi.fn().mockRejectedValue(new Error('Unauthorized'))
      localStorage.setItem('access_token', 'invalid-token')
      localStorage.setItem('refresh_token', 'invalid-refresh')

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
      expect(mockAPIClient.logout).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
    })

    it('should handle initialization error gracefully', async () => {
      localStorage.setItem('access_token', 'token-123')
      // Simulate error during initialization
      mockAPIClient.setTokens = vi.fn().mockImplementation(() => {
        throw new Error('Storage error')
      })
      mockAuthApi.me = vi.fn()

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      mockAuthApi.login = vi.fn().mockResolvedValue({
        user: mockUser,
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      })
      mockAuthApi.me = vi.fn()

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        const user = await result.current.login('test@example.com', 'password123')
        expect(user).toEqual(mockUser)
      })

      expect(mockAuthApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockAPIClient.setTokens).toHaveBeenCalledWith('new-token', 'new-refresh')
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle login failure', async () => {
      const loginError = new Error('Invalid credentials')
      mockAuthApi.login = vi.fn().mockRejectedValue(loginError)
      mockAuthApi.me = vi.fn()

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await expect(
          result.current.login('test@example.com', 'wrong-password')
        ).rejects.toThrow('Invalid credentials')
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should set loading state during login', async () => {
      mockAuthApi.login = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          user: mockUser,
          accessToken: 'token',
          refreshToken: 'refresh',
        }), 100))
      )
      mockAuthApi.me = vi.fn()

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.login('test@example.com', 'password123')
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      mockAuthApi.register = vi.fn().mockResolvedValue({
        user: mockUser,
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      })
      mockAuthApi.me = vi.fn()

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        const user = await result.current.register('test@example.com', 'password123', 'Test User')
        expect(user).toEqual(mockUser)
      })

      expect(mockAuthApi.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      })
      expect(mockAPIClient.setTokens).toHaveBeenCalledWith('new-token', 'new-refresh')
      expect(result.current.user).toEqual(mockUser)
    })

    it('should handle registration failure', async () => {
      const registerError = new Error('Email already exists')
      mockAuthApi.register = vi.fn().mockRejectedValue(registerError)
      mockAuthApi.me = vi.fn()

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await expect(
          result.current.register('test@example.com', 'password123', 'Test User')
        ).rejects.toThrow('Email already exists')
      })

      expect(result.current.user).toBeNull()
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockAuthApi.logout = vi.fn().mockResolvedValue(undefined)
      mockAuthApi.me = vi.fn().mockResolvedValue(mockUser)
      localStorage.setItem('access_token', 'token-123')

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(mockAuthApi.logout).toHaveBeenCalled()
      expect(mockAPIClient.logout).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should logout even if API call fails', async () => {
      mockAuthApi.logout = vi.fn().mockRejectedValue(new Error('Network error'))
      mockAuthApi.me = vi.fn().mockResolvedValue(mockUser)
      localStorage.setItem('access_token', 'token-123')

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(mockAPIClient.logout).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
    })
  })

  describe('refreshAuth', () => {
    it('should refresh auth successfully', async () => {
      mockAuthApi.me = vi.fn().mockResolvedValue(mockUser)
      localStorage.setItem('access_token', 'token-123')

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.refreshAuth()
      })

      expect(mockAuthApi.me).toHaveBeenCalledTimes(2) // Once on init, once on refresh
      expect(result.current.user).toEqual(mockUser)
    })

    it('should handle refresh failure', async () => {
      mockAuthApi.me = vi.fn()
        .mockResolvedValueOnce(mockUser) // Initial load
        .mockRejectedValueOnce(new Error('Unauthorized')) // Refresh fails
      localStorage.setItem('access_token', 'token-123')

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await expect(result.current.refreshAuth()).rejects.toThrow('Unauthorized')
      })
    })
  })

  describe('isAuthenticated', () => {
    it('should be false when user is null', async () => {
      mockAuthApi.me = vi.fn()

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should be true when user exists', async () => {
      mockAuthApi.me = vi.fn().mockResolvedValue(mockUser)
      localStorage.setItem('access_token', 'token-123')

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(true)
    })
  })
})

