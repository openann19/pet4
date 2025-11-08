import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, generatePasswordResetToken } from '../password-utils';

// Mock crypto for testing
const mockCrypto = {
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  subtle: {
    importKey: vi.fn(),
    deriveBits: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  // Use real crypto if available, otherwise use mock
  if (typeof global.crypto === 'undefined') {
    global.crypto = mockCrypto as unknown as Crypto;
  }
});

describe('password-utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const result = await hashPassword(password);

      expect(result.hash).toBeDefined();
      expect(result.hash).not.toBe(password);
      expect(result.salt).toBeDefined();
      expect(result.salt.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const result1 = await hashPassword(password);
      const result2 = await hashPassword(password);

      expect(result1.hash).not.toBe(result2.hash);
      expect(result1.salt).not.toBe(result2.salt);
    });

    it('should use provided salt', async () => {
      const password = 'TestPassword123!';
      const salt = new Uint8Array(16);
      crypto.getRandomValues(salt);
      const result = await hashPassword(password, salt);

      expect(result.salt).toBeDefined();
      expect(result.hash).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const { hash, salt } = await hashPassword(password);

      const isValid = await verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const { hash, salt } = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hash, salt);
      expect(isValid).toBe(false);
    });

    it('should reject password with wrong salt', async () => {
      const password = 'TestPassword123!';
      const { hash } = await hashPassword(password);
      const wrongSalt = new Uint8Array(16);
      crypto.getRandomValues(wrongSalt);
      const wrongSaltString = btoa(String.fromCharCode(...wrongSalt));

      const isValid = await verifyPassword(password, hash, wrongSaltString);
      expect(isValid).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const isValid = await verifyPassword('password', 'invalid-hash', 'invalid-salt');
      expect(isValid).toBe(false);
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a token', () => {
      const token = generatePasswordResetToken();

      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes * 2 hex chars
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate different tokens', () => {
      const token1 = generatePasswordResetToken();
      const token2 = generatePasswordResetToken();

      expect(token1).not.toBe(token2);
    });
  });
});
