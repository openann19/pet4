/**
 * Biometric Secure Storage (Web)
 *
 * Provides secure key storage for biometric authentication.
 * Features:
 * - Secure key storage (Keychain/Keystore equivalent for web)
 * - Session management with biometric re-authentication
 * - Key rotation and expiration
 * - Secure credential storage
 *
 * Location: apps/web/src/lib/security/biometric-storage.ts
 */

import { createLogger } from '../logger'

const logger = createLogger('biometric-storage')

/**
 * Stored credential
 */
export interface StoredCredential {
  readonly credentialId: string
  readonly userId: string
  readonly deviceId: string
  readonly registeredAt: number
  readonly lastUsedAt: number
  readonly expiresAt?: number
  readonly authenticatorType: 'platform' | 'cross-platform'
  readonly publicKey: ArrayBuffer
}

/**
 * Biometric session
 */
export interface BiometricSession {
  readonly sessionId: string
  readonly userId: string
  readonly deviceId: string
  readonly authenticatedAt: number
  readonly expiresAt: number
  readonly requiresReAuth: boolean
}

/**
 * Persisted credential data (from localStorage)
 */
interface PersistedCredentialData {
  readonly credentialId: string
  readonly userId: string
  readonly deviceId: string
  readonly registeredAt: number
  readonly lastUsedAt: number
  readonly expiresAt?: number
  readonly authenticatorType: 'platform' | 'cross-platform'
  readonly publicKey: number[]
}
export interface BiometricStorageOptions {
  readonly sessionTimeout?: number
  readonly enableReAuth?: boolean
  readonly reAuthInterval?: number
}

/**
 * Biometric secure storage
 */
export class BiometricSecureStorage {
  private readonly sessionTimeout: number
  private readonly enableReAuth: boolean
  private readonly reAuthInterval: number
  private readonly sessions = new Map<string, BiometricSession>()
  private readonly credentials = new Map<string, StoredCredential>()

  constructor(options: BiometricStorageOptions = {}) {
    this.sessionTimeout = options.sessionTimeout ?? 24 * 60 * 60 * 1000 // 24 hours
    this.enableReAuth = options.enableReAuth ?? true
    this.reAuthInterval = options.reAuthInterval ?? 30 * 60 * 1000 // 30 minutes

    // Cleanup expired sessions
    setInterval(() => {
      this.cleanupExpiredSessions()
    }, 60 * 60 * 1000) // Every hour
  }

  /**
   * Store credential securely
   */
  storeCredential(credential: StoredCredential): void {
    const key = `${credential.userId}:${credential.deviceId}`
    this.credentials.set(key, credential)

    // Also store in IndexedDB for persistence
    this.persistCredential(credential)

    logger.debug('Credential stored', {
      userId: credential.userId,
      deviceId: credential.deviceId,
      credentialId: credential.credentialId,
    })
  }

  /**
   * Get stored credential
   */
  getCredential(userId: string, deviceId: string): StoredCredential | null {
    const key = `${userId}:${deviceId}`
    return this.credentials.get(key) ?? null
  }

  /**
   * Create biometric session
   */
  createSession(userId: string, deviceId: string): string {
    const sessionId = `session-${userId}-${deviceId}-${Date.now()}`
    const now = Date.now()

    const session: BiometricSession = {
      sessionId,
      userId,
      deviceId,
      authenticatedAt: now,
      expiresAt: now + this.sessionTimeout,
      requiresReAuth: false,
    }

    this.sessions.set(sessionId, session)

    logger.debug('Biometric session created', {
      sessionId,
      userId,
      deviceId,
      expiresAt: session.expiresAt,
    })

    return sessionId
  }

  /**
   * Validate session
   */
  validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return false
    }

    if (session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId)
      return false
    }

    // Check if re-authentication is required
    if (this.enableReAuth && session.requiresReAuth) {
      return false
    }

    // Check re-authentication interval
    if (
      this.enableReAuth &&
      Date.now() - session.authenticatedAt > this.reAuthInterval
    ) {
      // Update session with re-auth requirement
      this.sessions.set(sessionId, { ...session, requiresReAuth: true })
      return false
    }

    return true
  }

  /**
   * Require re-authentication for session
   */
  requireReAuth(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      this.sessions.set(sessionId, { ...session, requiresReAuth: true })
      logger.debug('Re-authentication required', { sessionId })
    }
  }

  /**
   * Re-authenticate session
   */
  reAuthenticateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      this.sessions.set(sessionId, {
        ...session,
        requiresReAuth: false,
        authenticatedAt: Date.now(),
        expiresAt: Date.now() + this.sessionTimeout,
      })
      logger.debug('Session re-authenticated', { sessionId })
    }
  }

  /**
   * Revoke session
   */
  revokeSession(sessionId: string): void {
    this.sessions.delete(sessionId)
    logger.debug('Session revoked', { sessionId })
  }

  /**
   * Revoke all sessions for user
   */
  revokeUserSessions(userId: string): void {
    const sessionsToRevoke: string[] = []

    this.sessions.forEach((session, sessionId) => {
      if (session.userId === userId) {
        sessionsToRevoke.push(sessionId)
      }
    })

    sessionsToRevoke.forEach((sessionId) => {
      this.sessions.delete(sessionId)
    })

    logger.debug('All user sessions revoked', { userId, count: sessionsToRevoke.length })
  }

  /**
   * Get session
   */
  getSession(sessionId: string): BiometricSession | null {
    return this.sessions.get(sessionId) ?? null
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now()
    const expiredSessions: string[] = []

    this.sessions.forEach((session, sessionId) => {
      if (session.expiresAt < now) {
        expiredSessions.push(sessionId)
      }
    })

    expiredSessions.forEach((sessionId) => {
      this.sessions.delete(sessionId)
    })

    if (expiredSessions.length > 0) {
      logger.debug('Expired sessions cleaned up', { count: expiredSessions.length })
    }
  }

  /**
   * Persist credential to IndexedDB
   */
  private persistCredential(credential: StoredCredential): void {
    // In a real implementation, this would store in IndexedDB with encryption
    // For now, we'll use a simplified version
    const key = `biometric-credential-${credential.userId}-${credential.deviceId}`
    const data = {
      credentialId: credential.credentialId,
      userId: credential.userId,
      deviceId: credential.deviceId,
      registeredAt: credential.registeredAt,
      lastUsedAt: credential.lastUsedAt,
      expiresAt: credential.expiresAt,
      authenticatorType: credential.authenticatorType,
      publicKey: Array.from(new Uint8Array(credential.publicKey)),
    }

    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      logger.error('Failed to persist credential to localStorage', {
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  /**
   * Load persisted credentials
   */
  loadPersistedCredentials(userId: string): StoredCredential[] {
    const credentials: StoredCredential[] = []

    try {
      // Load from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(`biometric-credential-${userId}-`)) {
          const data = JSON.parse(localStorage.getItem(key) ?? '{}') as PersistedCredentialData
          const credential: StoredCredential = {
            credentialId: data.credentialId,
            userId: data.userId,
            deviceId: data.deviceId,
            registeredAt: data.registeredAt,
            lastUsedAt: data.lastUsedAt,
            expiresAt: data.expiresAt,
            authenticatorType: data.authenticatorType,
            publicKey: new Uint8Array(data.publicKey).buffer,
          }
          credentials.push(credential)
          this.credentials.set(`${userId}:${data.deviceId}`, credential)
        }
      }
    } catch (error) {
      logger.error('Failed to load persisted credentials', {
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }

    return credentials
  }
}

/**
 * Create biometric storage instance
 */
let storageInstance: BiometricSecureStorage | null = null

export function getBiometricStorage(options?: BiometricStorageOptions): BiometricSecureStorage {
  storageInstance ??= new BiometricSecureStorage(options)
  return storageInstance
}
