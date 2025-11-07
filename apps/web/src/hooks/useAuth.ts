import { useState, useEffect } from 'react'
import { enhancedAuth, type UserProfile } from '@/lib/enhanced-auth'
import { isTruthy, isDefined } from '@/core/guards';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        setIsLoading(true)
        await enhancedAuth.initialize()
        
        if (isTruthy(mounted)) {
          const currentUser = enhancedAuth.getCurrentUser()
          setUser(currentUser)
          setError(null)
        }
      } catch (err) {
        if (isTruthy(mounted)) {
          setError(err as Error)
        }
      } finally {
        if (isTruthy(mounted)) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      mounted = false
    }
  }, [])

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'githubId' | 'githubLogin'>>) => {
    const updated = await enhancedAuth.updateUserProfile(updates)
    if (isTruthy(updated)) {
      setUser(updated)
    }
    return updated
  }

  const updatePreferences = async (preferences: Partial<UserProfile['preferences']>) => {
    await enhancedAuth.updatePreferences(preferences)
    const updated = enhancedAuth.getCurrentUser()
    setUser(updated)
  }

  const logout = async () => {
    await enhancedAuth.logout()
    setUser(null)
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated: enhancedAuth.isAuthenticated(),
    hasRole: enhancedAuth.hasRole.bind(enhancedAuth),
    isOwner: enhancedAuth.isOwner.bind(enhancedAuth),
    updateProfile,
    updatePreferences,
    logout
  }
}
