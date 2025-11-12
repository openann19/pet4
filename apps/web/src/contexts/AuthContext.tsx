import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { APIClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { authApi } from '@/api/auth-api';
import type { User } from '@/lib/contracts';

const logger = createLogger('AuthContext');

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = async (): Promise<void> => {
    try {
      const profile = await authApi.me();
      setUser(profile);
      logger.info('User profile loaded', { userId: profile.id });
    } catch (error) {
      logger.error('Failed to load user profile', error);
      // Token might be invalid, clear it
      try {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } catch (storageError) {
        const err = storageError instanceof Error ? storageError : new Error(String(storageError));
        logger.error('Failed to clear tokens from localStorage', err);
      }
      APIClient.logout();
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async (): Promise<void> => {
      try {
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        try {
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            accessToken = localStorage.getItem('access_token');
            refreshToken = localStorage.getItem('refresh_token');
          }
        } catch (storageError) {
          const err =
            storageError instanceof Error ? storageError : new Error(String(storageError));
          logger.error('Failed to read tokens from localStorage', err);
        }

        if (accessToken && !cancelled) {
          APIClient.setTokens(accessToken, refreshToken ?? undefined);
          const profile = await authApi.me();
          if (!cancelled) {
            setUser(profile);
            logger.info('User profile loaded', { userId: profile.id });
          }
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('Failed to initialize auth', error);
          // Token might be invalid, clear it
          try {
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
            }
          } catch (storageError) {
            const err =
              storageError instanceof Error ? storageError : new Error(String(storageError));
            logger.error('Failed to clear tokens from localStorage', err);
          }
          APIClient.logout();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      APIClient.setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);

      logger.info('User logged in successfully', { userId: response.user.id });
      return response.user;
    } catch (error) {
      logger.error('Login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authApi.register({ email, password, displayName });
      APIClient.setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);

      logger.info('User registered successfully', { userId: response.user.id });
      return response.user;
    } catch (error) {
      logger.error('Registration failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      logger.warn('Logout API call failed, proceeding with local logout', error);
    }

    // Clear local state
    APIClient.logout();
    setUser(null);
    logger.info('User logged out');
  };

  const refreshAuth = async () => {
    try {
      await loadUserProfile();
    } catch (error) {
      logger.error('Failed to refresh auth', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
