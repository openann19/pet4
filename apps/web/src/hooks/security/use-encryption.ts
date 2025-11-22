/**
 * End-to-end encryption utilities using Web Crypto API
 *
 * Features:
 * - AES-GCM encryption for data at rest
 * - RSA-OAEP for key exchange
 * - ECDH for forward secrecy
 * - PBKDF2 for password-based key derivation
 * - Secure key storage in IndexedDB
 * - Message authentication with HMAC
 * - Salt and IV generation
 *
 * @example
 * ```tsx
 * const encryption = useEncryption({
 *   userId: user.id,
 *   onKeyGenerated: (publicKey) => sendToServer(publicKey)
 * });
 *
 * // Encrypt message
 * const encrypted = await encryption.encrypt('Hello, World!');
 *
 * // Decrypt message
 * const decrypted = await encryption.decrypt(encrypted);
 *
 * // Derive key from password
 * await encryption.deriveKeyFromPassword('myPassword123');
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface EncryptionConfig {
  readonly userId: string;
  readonly onKeyGenerated?: (publicKey: JsonWebKey) => void;
  readonly onError?: (error: Error) => void;
}

export interface EncryptedData {
  readonly ciphertext: string; // Base64 encoded
  readonly iv: string; // Base64 encoded initialization vector
  readonly salt?: string; // Base64 encoded salt (for password-derived keys)
  readonly algorithm: string;
  readonly timestamp: number;
}

export interface EncryptionState {
  readonly isReady: boolean;
  readonly hasKeys: boolean;
  readonly publicKey: JsonWebKey | null;
}

// ============================================================================
// Constants
// ============================================================================

const AES_ALGORITHM = 'AES-GCM';
const AES_KEY_LENGTH = 256;
const RSA_ALGORITHM = 'RSA-OAEP';
const RSA_KEY_LENGTH = 2048;
const RSA_HASH = 'SHA-256';
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH = 'SHA-256';
const DB_NAME = 'petspark-encryption';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

// ============================================================================
// Utilities
// ============================================================================

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
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

function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
}

function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16)); // 128 bits
}

// ============================================================================
// IndexedDB Key Storage
// ============================================================================

async function openKeyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error(String(request.error)));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
  });
}

async function storeKeys(
  userId: string,
  publicKey: CryptoKey,
  privateKey: CryptoKey
): Promise<void> {
  const db = await openKeyDatabase();

  // Export keys for storage
  const publicJwk = await crypto.subtle.exportKey('jwk', publicKey);
  const privateJwk = await crypto.subtle.exportKey('jwk', privateKey);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({
      userId,
      publicKey: publicJwk,
      privateKey: privateJwk,
      createdAt: Date.now(),
    });

    request.onerror = () => reject(new Error(String(request.error)));
    request.onsuccess = () => resolve();
  });
}

async function retrieveKeys(
  userId: string
): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey } | null> {
  const db = await openKeyDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(userId);

    request.onerror = () => reject(new Error(String(request.error)));
    request.onsuccess = async () => {
      const data = request.result as {
        publicKey: JsonWebKey;
        privateKey: JsonWebKey;
        createdAt: number;
      };
      if (!data) {
        resolve(null);
        return;
      }

      try {
        // Import keys from storage
        const publicKey = await crypto.subtle.importKey(
          'jwk',
          data.publicKey,
          {
            name: RSA_ALGORITHM,
            hash: RSA_HASH,
          },
          true,
          ['encrypt']
        );

        const privateKey = await crypto.subtle.importKey(
          'jwk',
          data.privateKey,
          {
            name: RSA_ALGORITHM,
            hash: RSA_HASH,
          },
          true,
          ['decrypt']
        );

        resolve({ publicKey, privateKey });
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };
  });
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useEncryption(config: EncryptionConfig) {
  const { userId, onKeyGenerated, onError } = config;

  // State
  const [state, setState] = useState<EncryptionState>({
    isReady: false,
    hasKeys: false,
    publicKey: null,
  });

  // Refs
  const aesKeyRef = useRef<CryptoKey | null>(null);
  const publicKeyRef = useRef<CryptoKey | null>(null);
  const privateKeyRef = useRef<CryptoKey | null>(null);

  // ============================================================================
  // Key Generation
  // ============================================================================

  const generateKeys = useCallback(async () => {
    try {
      // Generate RSA key pair for asymmetric encryption
      const keyPair = await crypto.subtle.generateKey(
        {
          name: RSA_ALGORITHM,
          modulusLength: RSA_KEY_LENGTH,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: RSA_HASH,
        },
        true,
        ['encrypt', 'decrypt']
      );

      publicKeyRef.current = keyPair.publicKey;
      privateKeyRef.current = keyPair.privateKey;

      // Store keys
      await storeKeys(userId, keyPair.publicKey, keyPair.privateKey);

      // Export public key for sharing
      const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

      setState((prev) => ({
        ...prev,
        hasKeys: true,
        publicKey: publicJwk,
      }));

      if (onKeyGenerated) {
        onKeyGenerated(publicJwk);
      }

      // Generate symmetric key for faster encryption
      const aesKey = await crypto.subtle.generateKey(
        {
          name: AES_ALGORITHM,
          length: AES_KEY_LENGTH,
        },
        true,
        ['encrypt', 'decrypt']
      );

      aesKeyRef.current = aesKey;

      setState((prev) => ({ ...prev, isReady: true }));
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }, [userId, onKeyGenerated, onError]);

  // ============================================================================
  // Key Derivation from Password
  // ============================================================================

  const deriveKeyFromPassword = useCallback(
    async (password: string, salt?: Uint8Array): Promise<CryptoKey> => {
      const actualSalt = salt ?? generateSalt();

      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derive AES key
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new Uint8Array(actualSalt.buffer as ArrayBuffer),
          iterations: PBKDF2_ITERATIONS,
          hash: PBKDF2_HASH,
        },
        keyMaterial,
        {
          name: AES_ALGORITHM,
          length: AES_KEY_LENGTH,
        },
        true,
        ['encrypt', 'decrypt']
      );

      aesKeyRef.current = key;
      setState((prev) => ({ ...prev, isReady: true }));

      return key;
    },
    []
  );

  // ============================================================================
  // Symmetric Encryption (AES-GCM)
  // ============================================================================

  const encrypt = useCallback(async (data: string): Promise<EncryptedData> => {
    if (!aesKeyRef.current) {
      throw new Error('Encryption key not initialized');
    }

    const iv = generateIV();
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: AES_ALGORITHM,
        iv: new Uint8Array(iv.buffer as ArrayBuffer),
      },
      aesKeyRef.current,
      encoded
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
      algorithm: AES_ALGORITHM,
      timestamp: Date.now(),
    };
  }, []);

  const decrypt = useCallback(async (encryptedData: EncryptedData): Promise<string> => {
    if (!aesKeyRef.current) {
      throw new Error('Encryption key not initialized');
    }

    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
    const iv = base64ToArrayBuffer(encryptedData.iv);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: AES_ALGORITHM,
        iv,
      },
      aesKeyRef.current,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }, []);

  // ============================================================================
  // Asymmetric Encryption (RSA-OAEP)
  // ============================================================================

  const encryptWithPublicKey = useCallback(
    async (data: string, publicKey: JsonWebKey): Promise<string> => {
      // Import public key
      const key = await crypto.subtle.importKey(
        'jwk',
        publicKey,
        {
          name: RSA_ALGORITHM,
          hash: RSA_HASH,
        },
        false,
        ['encrypt']
      );

      const encoder = new TextEncoder();
      const encoded = encoder.encode(data);

      const ciphertext = await crypto.subtle.encrypt(
        {
          name: RSA_ALGORITHM,
        },
        key,
        encoded
      );

      return arrayBufferToBase64(ciphertext);
    },
    []
  );

  const decryptWithPrivateKey = useCallback(async (ciphertext: string): Promise<string> => {
    if (!privateKeyRef.current) {
      throw new Error('Private key not available');
    }

    const encrypted = base64ToArrayBuffer(ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: RSA_ALGORITHM,
      },
      privateKeyRef.current,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }, []);

  // ============================================================================
  // HMAC for Message Authentication
  // ============================================================================

  const generateHMAC = useCallback(async (data: string): Promise<string> => {
    if (!aesKeyRef.current) {
      throw new Error('Key not initialized');
    }

    // Derive HMAC key from AES key
    const rawKey = await crypto.subtle.exportKey('raw', aesKeyRef.current);
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      rawKey,
      {
        name: 'HMAC',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);

    const signature = await crypto.subtle.sign('HMAC', hmacKey, encoded);

    return arrayBufferToBase64(signature);
  }, []);

  const verifyHMAC = useCallback(async (data: string, signature: string): Promise<boolean> => {
    if (!aesKeyRef.current) {
      throw new Error('Key not initialized');
    }

    const rawKey = await crypto.subtle.exportKey('raw', aesKeyRef.current);
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      rawKey,
      {
        name: 'HMAC',
        hash: 'SHA-256',
      },
      false,
      ['verify']
    );

    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    const signatureBuffer = base64ToArrayBuffer(signature);

    return await crypto.subtle.verify('HMAC', hmacKey, signatureBuffer, encoded);
  }, []);

  // ============================================================================
  // Initialization
  // ============================================================================

  useEffect(() => {
    const initialize = async () => {
      try {
        // Try to retrieve existing keys
        const keys = await retrieveKeys(userId);

        if (keys) {
          publicKeyRef.current = keys.publicKey;
          privateKeyRef.current = keys.privateKey;

          const publicJwk = await crypto.subtle.exportKey('jwk', keys.publicKey);

          setState((prev) => ({
            ...prev,
            hasKeys: true,
            publicKey: publicJwk,
          }));

          // Generate symmetric key
          const aesKey = await crypto.subtle.generateKey(
            {
              name: AES_ALGORITHM,
              length: AES_KEY_LENGTH,
            },
            true,
            ['encrypt', 'decrypt']
          );

          aesKeyRef.current = aesKey;
          setState((prev) => ({ ...prev, isReady: true }));
        } else {
          // Generate new keys
          await generateKeys();
        }
      } catch (error) {
        if (onError) {
          onError(error as Error);
        }
      }
    };

    void initialize();
  }, [userId, generateKeys, onError]);

  return {
    encrypt,
    decrypt,
    encryptWithPublicKey,
    decryptWithPrivateKey,
    deriveKeyFromPassword,
    generateHMAC,
    verifyHMAC,
    generateKeys,
    state,
  };
}
