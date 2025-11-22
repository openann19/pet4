/**
 * Biometric authentication using Web Authentication API (WebAuthn)
 *
 * Features:
 * - Fingerprint authentication
 * - Face ID support (where available)
 * - Platform authenticator (device-bound)
 * - Credential management
 * - Fallback to password when biometric unavailable
 * - Automatic re-authentication on session expiry
 *
 * @example
 * ```tsx
 * const biometric = useBiometricAuth({
 *   userId: user.id,
 *   onAuthenticated: (credential) => updateSession(credential),
 *   onFallback: () => showPasswordPrompt()
 * });
 *
 * // Register biometric
 * await biometric.register('user@example.com');
 *
 * // Authenticate
 * const success = await biometric.authenticate();
 *
 * // Check availability
 * if (biometric.isAvailable) {
 *   // Show biometric option
 * }
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { getBiometricStorage } from '@/lib/security/biometric-storage';
import { createLogger } from '@/lib/logger';

const _logger = createLogger('use-biometric-auth');

// ============================================================================
// Types
// ============================================================================

export interface BiometricAuthConfig {
  readonly userId: string;
  readonly userName?: string;
  readonly displayName?: string;
  readonly rpId?: string; // Relying party ID (usually domain)
  readonly rpName?: string; // Relying party name
  readonly timeout?: number;
  readonly onAuthenticated?: (credential: PublicKeyCredential) => void;
  readonly onFallback?: () => void;
  readonly onError?: (error: Error) => void;
}

export interface BiometricState {
  readonly isAvailable: boolean;
  readonly isRegistered: boolean;
  readonly isAuthenticating: boolean;
  readonly lastAuthentication: number | null;
  readonly authenticatorType: 'platform' | 'cross-platform' | null;
  readonly sessionId: string | null;
  readonly requiresReAuth: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT = 60000; // 60 seconds
const STORAGE_KEY_PREFIX = 'petspark_biometric_';
const CHALLENGE_LENGTH = 32;

// ============================================================================
// Utilities
// ============================================================================

function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(CHALLENGE_LENGTH));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function stringToArrayBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useBiometricAuth(config: BiometricAuthConfig) {
  const {
    userId,
    userName = userId,
    displayName = userName,
    rpId = window.location.hostname,
    rpName = 'PetSpark',
    timeout = DEFAULT_TIMEOUT,
    onAuthenticated,
    onFallback,
    onError,
  } = config;

  // State
  const [state, setState] = useState<BiometricState>({
    isAvailable: false,
    isRegistered: false,
    isAuthenticating: false,
    lastAuthentication: null,
    authenticatorType: null,
    sessionId: null,
    requiresReAuth: false,
  });

  // Biometric storage
  const biometricStorage = getBiometricStorage({
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    enableReAuth: true,
    reAuthInterval: 30 * 60 * 1000, // 30 minutes
  });

  // ============================================================================
  // Availability Check
  // ============================================================================

  const checkAvailability = useCallback(async (): Promise<boolean> => {
    // Check if Web Authentication API is supported
    if (!window.PublicKeyCredential) {
      return false;
    }

    try {
      // Check if platform authenticator is available
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  }, []);

  // ============================================================================
  // Registration
  // ============================================================================

  const register = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isAuthenticating: true }));

      const challenge = generateChallenge();

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
        {
          challenge: new Uint8Array(challenge.buffer as ArrayBuffer),
          rp: {
            id: rpId,
            name: rpName,
          },
          user: {
            id: stringToArrayBuffer(userId),
            name: userName,
            displayName,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false,
          },
          timeout,
          attestation: 'none',
        };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Store credential securely
      const credentialId = arrayBufferToBase64(credential.rawId);
      const deviceId = `device-${userId}-${Date.now()}`;

      // Store credential response for later use
      // Note: Public key extraction from WebAuthn credential requires server-side verification
      // For client-side storage, we store the credential ID and rely on the browser's secure storage
      const publicKey = new Uint8Array(32).buffer; // Placeholder - actual key would come from server verification

      biometricStorage.storeCredential({
        credentialId,
        userId,
        deviceId,
        registeredAt: Date.now(),
        lastUsedAt: Date.now(),
        authenticatorType: 'platform',
        publicKey,
      });

      // Create session
      const sessionId = biometricStorage.createSession(userId, deviceId);

      setState((prev) => ({
        ...prev,
        isRegistered: true,
        isAuthenticating: false,
        authenticatorType: 'platform',
        sessionId,
        requiresReAuth: false,
      }));

      return true;
    } catch (error) {
      setState((prev) => ({ ...prev, isAuthenticating: false }));

      if (onError) {
        onError(error as Error);
      }

      if (onFallback) {
        onFallback();
      }

      return false;
    }
  }, [
    userId,
    userName,
    displayName,
    rpId,
    rpName,
    timeout,
    onError,
    onFallback,
  ]);

  // ============================================================================
  // Authentication
  // ============================================================================

  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isAuthenticating: true }));

      // Retrieve stored credential ID
      const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        throw new Error('No biometric credential registered');
      }

      const { credentialId } = JSON.parse(stored) as {
        credentialId: string;
      };

      const challenge = generateChallenge();

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
        {
          challenge: new Uint8Array(challenge.buffer as ArrayBuffer),
          allowCredentials: [
            {
              id: base64ToArrayBuffer(credentialId),
              type: 'public-key',
              transports: ['internal'],
            },
          ],
          timeout,
          userVerification: 'required',
          rpId,
        };

      const credential = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Authentication failed');
      }

      // Get or create session
      let sessionId = state.sessionId;
      if (!sessionId || !biometricStorage.validateSession(sessionId)) {
        const deviceId = `device-${userId}`;
        sessionId = biometricStorage.createSession(userId, deviceId);
      } else {
        biometricStorage.reAuthenticateSession(sessionId);
      }

      setState((prev) => ({
        ...prev,
        isAuthenticating: false,
        lastAuthentication: Date.now(),
        sessionId,
        requiresReAuth: false,
      }));

      if (onAuthenticated) {
        onAuthenticated(credential);
      }

      return true;
    } catch (error) {
      setState((prev) => ({ ...prev, isAuthenticating: false }));

      if (onError) {
        onError(error as Error);
      }

      if (onFallback) {
        onFallback();
      }

      return false;
    }
  }, [userId, timeout, rpId, onAuthenticated, onError, onFallback]);

  // ============================================================================
  // Credential Management
  // ============================================================================

  const unregister = useCallback(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
    localStorage.removeItem(storageKey);

    // Revoke all sessions
    if (state.sessionId) {
      biometricStorage.revokeSession(state.sessionId);
    }
    biometricStorage.revokeUserSessions(userId);

    setState((prev) => ({
      ...prev,
      isRegistered: false,
      authenticatorType: null,
      sessionId: null,
      requiresReAuth: false,
    }));
  }, [userId, state.sessionId, biometricStorage]);

  const isRegistered = useCallback((): boolean => {
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
    return localStorage.getItem(storageKey) !== null;
  }, [userId]);

  // ============================================================================
  // Initialization
  // ============================================================================

  useEffect(() => {
    const initialize = async () => {
      const available = await checkAvailability();
      const registered = isRegistered();

      // Load persisted credentials
      if (registered) {
        await biometricStorage.loadPersistedCredentials(userId);
      }

      // Check if session requires re-authentication
      let requiresReAuth = false;
      const sessionId = state.sessionId;

      if (sessionId) {
        const isValid = biometricStorage.validateSession(sessionId);
        if (!isValid) {
          const session = biometricStorage.getSession(sessionId);
          requiresReAuth = session?.requiresReAuth ?? false;
        }
      }

      setState((prev) => ({
        ...prev,
        isAvailable: available,
        isRegistered: registered,
        requiresReAuth,
        sessionId,
      }));
    };

    void initialize();
  }, [checkAvailability, isRegistered, userId, biometricStorage, state.sessionId]);

  return {
    register,
    authenticate,
    unregister,
    isRegistered: isRegistered(),
    state,
  };
}
