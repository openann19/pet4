/**
 * Tests for password utilities
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, generatePasswordResetToken } from '../password-utils';

vi.mock('../logger', () => ({
  log: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('password-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password and return hash and salt', async () => {
      const result = await hashPassword('test-password');

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(result.hash).toBeTruthy();
      expect(result.salt).toBeTruthy();
      expect(typeof result.hash).toBe('string');
      expect(typeof result.salt).toBe('string');
    });

    it('should use provided salt when given', async () => {
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);

      const result1 = await hashPassword('test-password', salt);
      const result2 = await hashPassword('test-password', salt);

      expect(result1.hash).toBe(result2.hash);
      expect(result1.salt).toBe(result2.salt);
    });

    it('should generate different hashes for different passwords', async () => {
      const result1 = await hashPassword('password1');
      const result2 = await hashPassword('password2');

      expect(result1.hash).not.toBe(result2.hash);
    });

    it('should generate different salts for same password', async () => {
      const result1 = await hashPassword('test-password');
      const result2 = await hashPassword('test-password');

      expect(result1.salt).not.toBe(result2.salt);
      expect(result1.hash).not.toBe(result2.hash);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const { hash, salt } = await hashPassword('test-password');
      const isValid = await verifyPassword('test-password', hash, salt);

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const { hash, salt } = await hashPassword('test-password');
      const isValid = await verifyPassword('wrong-password', hash, salt);

      expect(isValid).toBe(false);
    });

    it('should return false for invalid salt', async () => {
      const { hash } = await hashPassword('test-password');
      const isValid = await verifyPassword('test-password', hash, 'invalid-salt');

      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash', async () => {
      const { salt } = await hashPassword('test-password');
      const isValid = await verifyPassword('test-password', 'invalid-hash', salt);

      expect(isValid).toBe(false);
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a token string', () => {
      const token = generatePasswordResetToken();

      expect(typeof token).toBe('string');
      expect(token.length).toBe(64);
    });

    it('should generate different tokens on each call', () => {
      const token1 = generatePasswordResetToken();
      const token2 = generatePasswordResetToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate hexadecimal token', () => {
      const token = generatePasswordResetToken();
      const hexPattern = /^[0-9a-f]{64}$/;

      expect(hexPattern.test(token)).toBe(true);
    });
  });
});
