import { useState, useEffect } from 'react';
import { enhancedAuth, type UserProfile } from '@/lib/enhanced-auth';

export function useAuth(): {
  user: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  isOwner: (userId: string) => boolean;
  updateProfile: (
    updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'githubId' | 'githubLogin'>>
  ) => Promise<UserProfile | null>;
  updatePreferences: (preferences: Partial<UserProfile['preferences']>) => Promise<void>;
  logout: () => Promise<void>;
} {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        setIsLoading(true);
        await enhancedAuth.initialize();

        if (mounted) {
          const currentUser = enhancedAuth.getCurrentUser();
          setUser(currentUser);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    // Initialize auth asynchronously - fire-and-forget with error handling inside
    void initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const updateProfile = async (
    updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'githubId' | 'githubLogin'>>
  ) => {
    const updated = await enhancedAuth.updateUserProfile(updates);
    if (updated) {
      setUser(updated);
    }
    return updated;
  };

  const updatePreferences = async (preferences: Partial<UserProfile['preferences']>) => {
    await enhancedAuth.updatePreferences(preferences);
    const updated = enhancedAuth.getCurrentUser();
    setUser(updated);
  };

  const logout = async () => {
    await enhancedAuth.logout();
    setUser(null);
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: enhancedAuth.isAuthenticated(),
    hasRole: enhancedAuth.hasRole.bind(enhancedAuth),
    isOwner: enhancedAuth.isOwner.bind(enhancedAuth),
    updateProfile,
    updatePreferences,
    logout,
  };
}
