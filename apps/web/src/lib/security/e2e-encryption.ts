/**
 * End-to-End Encryption (Web)
 *
 * Enhanced E2E encryption with forward secrecy, key exchange, and device verification.
 * Features:
 * - Forward secrecy implementation
 * - Key exchange and management improvements
 * - Device verification
 * - Message encryption with AES-256-GCM
 * - Key rotation strategies
 * - Secure key storage improvements
 *
 * Location: apps/web/src/lib/security/e2e-encryption.ts
 */

import { createLogger } from '../logger'
import { getKeyManager, type KeyManager, type DeviceInfo } from './key-management'

const logger = createLogger('e2e-encryption')

/**
 * E2E encryption message
 */
export interface E2EMessage {
  readonly messageId: string
  readonly senderId: string
  readonly recipientId: string
  readonly ciphertext: string
  readonly iv: string
  readonly keyId: string
  readonly timestamp: number
  readonly deviceId: string
  readonly verified: boolean
}

/**
 * Forward secrecy session
 */
export interface ForwardSecrecySession {
  readonly sessionId: string
  readonly userId: string
  readonly deviceId: string
  readonly ephemeralKey: CryptoKey
  readonly sharedSecret: ArrayBuffer
  readonly createdAt: number
  readonly expiresAt: number
}

/**
 * E2E encryption options
 */
export interface E2EEncryptionOptions {
  readonly enableForwardSecrecy?: boolean
  readonly enableDeviceVerification?: boolean
  readonly sessionTimeout?: number
  readonly keyRotationInterval?: number
}

/**
 * E2E encryption service
 */
export class E2EEncryptionService {
  private readonly keyManager: KeyManager
  private readonly enableForwardSecrecy: boolean
  private readonly enableDeviceVerification: boolean
  private readonly sessionTimeout: number
  private readonly sessions = new Map<string, ForwardSecrecySession>()

  constructor(options: E2EEncryptionOptions = {}) {
    this.enableForwardSecrecy = options.enableForwardSecrecy ?? true
    this.enableDeviceVerification = options.enableDeviceVerification ?? true
    this.sessionTimeout = options.sessionTimeout ?? 24 * 60 * 60 * 1000 // 24 hours

    this.keyManager = getKeyManager({
      rotationStrategy: 'time-based',
      rotationInterval: options.keyRotationInterval ?? 30 * 24 * 60 * 60 * 1000,
      enableForwardSecrecy: this.enableForwardSecrecy,
      enableDeviceVerification: this.enableDeviceVerification,
    })

    // Cleanup expired sessions
    setInterval(() => {
      this.cleanupExpiredSessions()
    }, 60 * 60 * 1000) // Every hour
  }

  /**
   * Establish forward secrecy session
   */
  async establishSession(
    userId: string,
    deviceId: string,
    recipientPublicKey: JsonWebKey
  ): Promise<string> {
    if (!this.enableForwardSecrecy) {
      throw new Error('Forward secrecy is not enabled')
    }

    const sessionId = `session-${userId}-${deviceId}-${Date.now()}`

    // Generate ephemeral key pair for this session
    const ephemeralKeyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveBits']
    )

    // Export public key
    const ephemeralPublicKey = await crypto.subtle.exportKey('jwk', ephemeralKeyPair.publicKey)

    // Import recipient's public key
    const recipientKey = await crypto.subtle.importKey(
      'jwk',
      recipientPublicKey,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      false,
      []
    )

    // Derive shared secret
    const sharedSecret = await crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: recipientKey,
      },
      ephemeralKeyPair.privateKey,
      256
    )

    const session: ForwardSecrecySession = {
      sessionId,
      userId,
      deviceId,
      ephemeralKey: ephemeralKeyPair.privateKey,
      sharedSecret,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
    }

    this.sessions.set(sessionId, session)

    logger.debug('Forward secrecy session established', {
      sessionId,
      userId,
      deviceId,
      expiresAt: session.expiresAt,
    })

    return sessionId
  }

  /**
   * Encrypt message with forward secrecy
   */
  async encryptMessage(
    sessionId: string,
    message: string,
    senderId: string,
    recipientId: string,
    deviceId: string
  ): Promise<E2EMessage> {
    const session = this.sessions.get(sessionId)

    if (!session) {
      throw new Error('Session not found')
    }

    if (session.expiresAt < Date.now()) {
      throw new Error('Session expired')
    }

    // Derive encryption key from shared secret
    const encryptionKey = await this.deriveEncryptionKey(session.sharedSecret)

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt message
    const encoder = new TextEncoder()
    const encoded = encoder.encode(message)

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      encryptionKey,
      encoded
    )

    // Get active key pair for device verification
    const keyPair = this.keyManager.getActiveKeyPair(senderId, deviceId)

    const e2eMessage: E2EMessage = {
      messageId: `msg-${senderId}-${recipientId}-${Date.now()}`,
      senderId,
      recipientId,
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv),
      keyId: keyPair?.keyId ?? '',
      timestamp: Date.now(),
      deviceId,
      verified: this.enableDeviceVerification
        ? this.keyManager.verifyDevice(deviceId, '')
        : false,
    }

    logger.debug('Message encrypted with forward secrecy', {
      messageId: e2eMessage.messageId,
      sessionId,
      senderId,
      recipientId,
    })

    return e2eMessage
  }

  /**
   * Decrypt message with forward secrecy
   */
  async decryptMessage(sessionId: string, message: E2EMessage): Promise<string> {
    const session = this.sessions.get(sessionId)

    if (!session) {
      throw new Error('Session not found')
    }

    if (session.expiresAt < Date.now()) {
      throw new Error('Session expired')
    }

    // Verify device if enabled
    if (this.enableDeviceVerification && !message.verified) {
      throw new Error('Device verification failed')
    }

    // Derive decryption key from shared secret
    const decryptionKey = await this.deriveEncryptionKey(session.sharedSecret)

    // Decrypt message
    const ciphertext = this.base64ToArrayBuffer(message.ciphertext)
    const iv = this.base64ToArrayBuffer(message.iv)

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      decryptionKey,
      ciphertext
    )

    const decoder = new TextDecoder()
    const plaintext = decoder.decode(decrypted)

    logger.debug('Message decrypted with forward secrecy', {
      messageId: message.messageId,
      sessionId,
    })

    return plaintext
  }

  /**
   * Derive encryption key from shared secret
   */
  private async deriveEncryptionKey(sharedSecret: ArrayBuffer): Promise<CryptoKey> {
    // Import shared secret as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    // Derive AES-GCM key
    const salt = new Uint8Array(16) // Use a constant salt for session keys
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    )

    return key
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
   * Array buffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i]
      if (byte !== undefined) {
        binary += String.fromCharCode(byte)
      }
    }
    return btoa(binary)
  }

  /**
   * Base64 to array buffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * Get session
   */
  getSession(sessionId: string): ForwardSecrecySession | null {
    return this.sessions.get(sessionId) ?? null
  }

  /**
   * Revoke session
   */
  revokeSession(sessionId: string): void {
    this.sessions.delete(sessionId)
    logger.debug('Session revoked', { sessionId })
  }
}

/**
 * Create E2E encryption service instance
 */
let e2eServiceInstance: E2EEncryptionService | null = null

export function getE2EEncryptionService(options?: E2EEncryptionOptions): E2EEncryptionService {
  if (!e2eServiceInstance) {
    e2eServiceInstance = new E2EEncryptionService(options)
  }
  return e2eServiceInstance
}
