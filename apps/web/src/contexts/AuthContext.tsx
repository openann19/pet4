import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { APIClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { authApi } from '@/api/auth-api';
import type { User } from '@/lib/contracts';

const logger = createLogger('AuthContext');

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

export interface SignUpData {
  readonly email: string;
  readonly password: string;
  readonly username: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly agreeToTerms: boolean;
  readonly marketingConsent?: boolean;
}

export interface AuthState {
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly isInitialized: boolean;
  readonly lastLoginAt: Date | null;
  readonly sessionExpiresAt: Date | null;
  readonly error: string | null;
}

export interface AuthContextType {
  // Core state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Extended state
  readonly state: AuthState;
  readonly isInitialized: boolean;
  readonly lastLoginAt: Date | null;
  readonly sessionExpiresAt: Date | null;
  readonly error: string | null;

  // Backward compatible methods
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;

  // Advanced authentication methods
  readonly signIn: (credentials: LoginCredentials) => Promise<User>;
  readonly signUp: (data: SignUpData) => Promise<User>;
  readonly signOut: () => Promise<void>;
  readonly refreshUser: () => Promise<User | null>;
  readonly updateUser: (updates: Partial<User>) => void;
  readonly clearError: () => void;

  // OAuth methods
  readonly signInWithGoogle: (token: string) => Promise<User>;
  readonly signInWithApple: (token: string) => Promise<User>;

  // Session management
  readonly extendSession: () => Promise<void>;
  readonly checkSession: () => Promise<boolean>;
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastLoginAt, setLastLoginAt] = useState<Date | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          setIsInitialized(true);
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
    setError(null);
    try {
      const response = await authApi.login({ email, password });
      APIClient.setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      setLastLoginAt(new Date());
      setSessionExpiresAt(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours

      logger.info('User logged in successfully', { userId: response.user.id });
      return response.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      logger.error('Login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.register({ email, password, displayName });
      APIClient.setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      setLastLoginAt(new Date());
      setSessionExpiresAt(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours

      logger.info('User registered successfully', { userId: response.user.id });
      return response.user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
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
    setLastLoginAt(null);
    setSessionExpiresAt(null);
    setError(null);
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

  // Advanced authentication methods
  const signIn = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    return login(credentials.email, credentials.password);
  }, []);

  const signUp = useCallback(async (data: SignUpData): Promise<User> => {
    return register(data.email, data.password, data.username);
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    return logout();
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      await refreshAuth();
      return user;
    } catch (error) {
      logger.warn('Failed to refresh user session', error);
      return null;
    }
  }, [refreshAuth, user]);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    logger.info('User data updated locally', { userId: updatedUser.id, updates: Object.keys(updates) });
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signInWithGoogle = useCallback((token: string): Promise<User> => {
    setIsLoading(true);
    setError(null);

    const hasToken = typeof token === 'string' && token.length > 0;

    return Promise.reject<User>(new Error('Google sign in not yet implemented'))
      .catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        const errorMessage = err.message ?? 'Google sign in failed';
        setError(errorMessage);
        logger.error('Google sign in failed', { error: err, hasToken });
        throw err;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const signInWithApple = useCallback((token: string): Promise<User> => {
    setIsLoading(true);
    setError(null);

    const hasToken = typeof token === 'string' && token.length > 0;

    return Promise.reject<User>(new Error('Apple sign in not yet implemented'))
      .catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        const errorMessage = err.message ?? 'Apple sign in failed';
        setError(errorMessage);
        logger.error('Apple sign in failed', { error: err, hasToken });
        throw err;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const extendSession = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      logger.info('Extending user session');

      // Use the existing refresh method
      const response = await authApi.refresh();
      APIClient.setTokens(response.accessToken, response.refreshToken);
      setSessionExpiresAt(new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours

      logger.info('Session extended successfully');
    } catch (error) {
      logger.error('Failed to extend session', { error });
      throw error;
    }
  }, [user]);

  const checkSession = useCallback(async (): Promise<boolean> => {
    if (!user || !sessionExpiresAt) return false;

    const now = new Date();
    const expiresAt = new Date(sessionExpiresAt);

    // Check if session expires within next 5 minutes
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt <= fiveMinutesFromNow) {
      try {
        await extendSession();
        return true;
      } catch (error) {
        logger.warn('Session extension failed, signing out', error);
        await signOut();
        return false;
      }
    }

    return true;
  }, [user, sessionExpiresAt, extendSession, signOut]);

  // Auto session checking
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkSession().catch(() => {
        // Session check failed, will be handled by checkSession
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, checkSession]);

  // Create auth state object
  const authState: AuthState = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    lastLoginAt,
    sessionExpiresAt,
    error
  }), [user, isLoading, isInitialized, lastLoginAt, sessionExpiresAt, error]);

  const value: AuthContextType = useMemo(() => ({
    // Core state
    user,
    isAuthenticated: !!user,
    isLoading,

    // Extended state
    state: authState,
    isInitialized,
    lastLoginAt,
    sessionExpiresAt,
    error,

    // Backward compatible methods
    login,
    register,
    logout,
    refreshAuth,

    // Advanced authentication methods
    signIn,
    signUp,
    signOut,
    refreshUser,
    updateUser,
    clearError,

    // OAuth methods
    signInWithGoogle,
    signInWithApple,

    // Session management
    extendSession,
    checkSession
  }), [
    user,
    isLoading,
    authState,
    isInitialized,
    lastLoginAt,
    sessionExpiresAt,
    error,
    login,
    register,
    logout,
    refreshAuth,
    signIn,
    signUp,
    signOut,
    refreshUser,
    updateUser,
    clearError,
    signInWithGoogle,
    signInWithApple,
    extendSession,
    checkSession
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to get the current user
 */
export function useCurrentUser(): User | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
