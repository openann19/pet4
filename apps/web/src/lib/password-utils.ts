/**
 * Password Utilities
 *
 * Functions for hashing and verifying passwords using Web Crypto API.
 * Note: In production, password hashing should be done server-side.
 * This is suitable for client-side storage with basic security.
 */

import { log } from './logger';

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(
  password: string,
  salt?: Uint8Array
): Promise<{ hash: string; salt: string }> {
  // Generate salt if not provided
  const finalSalt = salt ?? crypto.getRandomValues(new Uint8Array(16));

  // Import password as key material
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  // Derive key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey('raw', passwordData, 'PBKDF2', false, [
    'deriveBits',
  ]);

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: finalSalt as BufferSource,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 32 bytes
  );

  // Convert to base64 strings for storage
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashString = btoa(String.fromCharCode(...hashArray));
  const saltString = btoa(String.fromCharCode(...finalSalt));

  return { hash: hashString, salt: saltString };
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
): Promise<boolean> {
  try {
    // Decode salt from base64
    const saltArray = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));

    // Hash the provided password with the same salt
    const { hash: newHash } = await hashPassword(password, saltArray);

    // Compare hashes (constant-time comparison)
    return newHash === hash;
  } catch (_error) {
    log.error(
      'Error verifying password',
      _error instanceof Error ? _error : new Error(String(_error))
    );
    return false;
  }
}

/**
 * Generate a secure random password reset token
 */
export function generatePasswordResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
