import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hashPassword, verifyPassword, generatePasswordResetToken } from '../password-utils';

// Mock the logger
const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

vi.mock('../logger', () => ({
  log: mockLogger,
}));

// Mock crypto API
const mockCrypto = {
  getRandomValues: vi.fn(),
  subtle: {
    importKey: vi.fn(),
    deriveBits: vi.fn(),
  },
};

// Store original crypto
const originalCrypto = global.crypto;

describe('password-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.crypto = mockCrypto as any;
  });

  afterEach(() => {
    global.crypto = originalCrypto;
  });

  describe('hashPassword', () => {
    it('should hash password with generated salt', async () => {
      // Mock salt generation
      const mockSalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      mockCrypto.getRandomValues.mockReturnValue(mockSalt);

      // Mock key import
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);

      // Mock hash derivation
      const mockHashBuffer = new ArrayBuffer(32);
      const mockHashArray = new Uint8Array(mockHashBuffer);
      mockHashArray.set([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        26, 27, 28, 29, 30, 31, 32,
      ]);
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockHashBuffer);

      const result = await hashPassword('test-password');

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        'PBKDF2',
        false,
        ['deriveBits']
      );
      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        {
          name: 'PBKDF2',
          salt: mockSalt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        expect.any(CryptoKey),
        256
      );
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(typeof result.hash).toBe('string');
      expect(typeof result.salt).toBe('string');
    });

    it('should hash password with provided salt', async () => {
      const providedSalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      const mockHashBuffer = new ArrayBuffer(32);
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockHashBuffer);

      await hashPassword('test-password', providedSalt);

      expect(mockCrypto.getRandomValues).not.toHaveBeenCalled();
      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        expect.objectContaining({
          salt: providedSalt,
        }),
        expect.any(CryptoKey),
        256
      );
    });

    it('should use correct PBKDF2 parameters', async () => {
      const mockSalt = new Uint8Array(16);
      mockCrypto.getRandomValues.mockReturnValue(mockSalt);
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      await hashPassword('test-password');

      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        {
          name: 'PBKDF2',
          salt: mockSalt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        expect.any(CryptoKey),
        256
      );
    });

    it('should handle empty password', async () => {
      const mockSalt = new Uint8Array(16);
      mockCrypto.getRandomValues.mockReturnValue(mockSalt);
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      const result = await hashPassword('');

      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
    });

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const mockSalt = new Uint8Array(16);
      mockCrypto.getRandomValues.mockReturnValue(mockSalt);
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      const result = await hashPassword(longPassword);

      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
    });

    it('should handle crypto API errors', async () => {
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16));
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto API error'));

      await expect(hashPassword('test-password')).rejects.toThrow('Crypto API error');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'test-password';
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const saltString = btoa(String.fromCharCode(...Array.from(salt)));

      // Mock hashPassword to return consistent hash
      const mockHash = 'mock-hash-value';
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16));
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      // First call to hashPassword for verification
      vi.mocked(hashPassword).mockResolvedValueOnce({ hash: mockHash, salt: saltString });

      const result = await verifyPassword(password, mockHash, saltString);

      expect(result).toBe(true);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should reject incorrect password', async () => {
      const password = 'wrong-password';
      const correctHash = 'correct-hash-value';
      const saltString = btoa(String.fromCharCode(...Array.from(new Uint8Array(16))));

      // Mock hashPassword to return different hash
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16));
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      vi.mocked(hashPassword).mockResolvedValueOnce({ hash: 'different-hash', salt: saltString });

      const result = await verifyPassword(password, correctHash, saltString);

      expect(result).toBe(false);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle malformed salt', async () => {
      const invalidSalt = 'invalid-salt-string';

      const result = await verifyPassword('password', 'hash', invalidSalt);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error verifying password', expect.any(Error));
    });

    it('should handle malformed hash', async () => {
      const saltString = btoa(String.fromCharCode(...Array.from(new Uint8Array(16))));

      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16));
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      vi.mocked(hashPassword).mockRejectedValueOnce(new Error('Hash error'));

      const result = await verifyPassword('password', 'hash', saltString);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error verifying password', expect.any(Error));
    });

    it('should handle empty password', async () => {
      const saltString = btoa(String.fromCharCode(...Array.from(new Uint8Array(16))));
      const mockHash = 'mock-hash';

      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16));
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      vi.mocked(hashPassword).mockResolvedValueOnce({ hash: mockHash, salt: saltString });

      const result = await verifyPassword('', mockHash, saltString);

      expect(result).toBe(true);
    });

    it('should handle crypto errors during verification', async () => {
      const saltString = btoa(String.fromCharCode(...Array.from(new Uint8Array(16))));

      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16));
      mockCrypto.subtle.importKey.mockRejectedValueOnce(new Error('Crypto error'));

      const result = await verifyPassword('password', 'hash', saltString);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error verifying password', expect.any(Error));
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate token of correct length', () => {
      const mockArray = new Uint8Array(32);
      mockArray.set([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        26, 27, 28, 29, 30, 31, 32,
      ]);
      mockCrypto.getRandomValues.mockReturnValue(mockArray);

      const token = generatePasswordResetToken();

      expect(token).toBe('0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20');
      expect(token.length).toBe(64); // 32 bytes * 2 hex chars each
    });

    it('should generate different tokens on multiple calls', () => {
      const mockArray1 = new Uint8Array(32).fill(1);
      const mockArray2 = new Uint8Array(32).fill(2);

      mockCrypto.getRandomValues.mockReturnValueOnce(mockArray1).mockReturnValueOnce(mockArray2);

      const token1 = generatePasswordResetToken();
      const token2 = generatePasswordResetToken();

      expect(token1).not.toBe(token2);
      expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(2);
    });

    it('should use crypto.getRandomValues', () => {
      const mockArray = new Uint8Array(32);
      mockCrypto.getRandomValues.mockReturnValue(mockArray);

      generatePasswordResetToken();

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });

    it('should generate valid hex string', () => {
      const mockArray = new Uint8Array(32);
      mockArray.set([255, 16, 0, 1]);
      mockCrypto.getRandomValues.mockReturnValue(mockArray);

      const token = generatePasswordResetToken();

      expect(token).toMatch(/^[0-9a-f]+$/);
      expect(token).toContain('ff');
      expect(token).toContain('10');
      expect(token).toContain('00');
      expect(token).toContain('01');
    });

    it('should handle zero values', () => {
      const mockArray = new Uint8Array(32).fill(0);
      mockCrypto.getRandomValues.mockReturnValue(mockArray);

      const token = generatePasswordResetToken();

      expect(token).toBe('00'.repeat(32));
      expect(token.length).toBe(64);
    });

    it('should handle maximum values', () => {
      const mockArray = new Uint8Array(32).fill(255);
      mockCrypto.getRandomValues.mockReturnValue(mockArray);

      const token = generatePasswordResetToken();

      expect(token).toBe('ff'.repeat(32));
      expect(token.length).toBe(64);
    });
  });

  describe('integration tests', () => {
    it('should handle complete password workflow', async () => {
      const password = 'user-password-123';

      // Setup mocks
      const mockSalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      mockCrypto.getRandomValues.mockReturnValue(mockSalt);
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);

      const mockHashBuffer = new ArrayBuffer(32);
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockHashBuffer);

      // Hash password
      const { hash, salt } = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(salt).toBeDefined();

      // Reset mocks for verification
      vi.clearAllMocks();
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(mockHashBuffer);

      // Verify password
      vi.mocked(hashPassword).mockResolvedValueOnce({ hash, salt });
      const isValid = await verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);

      // Verify wrong password
      vi.mocked(hashPassword).mockResolvedValueOnce({ hash: 'wrong-hash', salt });
      const isInvalid = await verifyPassword('wrong-password', hash, salt);
      expect(isInvalid).toBe(false);
    });

    it('should handle multiple users with different passwords', async () => {
      const passwords = ['password1', 'password2', 'password3'];
      const results: Array<{ hash: string; salt: string }> = [];

      // Hash multiple passwords
      for (const password of passwords) {
        const mockSalt = new Uint8Array(16).fill(Math.random() * 256);
        mockCrypto.getRandomValues.mockReturnValue(mockSalt);
        mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
        mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

        const result = await hashPassword(password);
        results.push(result);
      }

      expect(results).toHaveLength(3);
      expect(results[0].hash).not.toBe(results[1].hash);
      expect(results[0].hash).not.toBe(results[2].hash);
      expect(results[1].hash).not.toBe(results[2].hash);

      // Verify each password with its own hash
      for (let i = 0; i < passwords.length; i++) {
        mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
        mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));
        vi.mocked(hashPassword).mockResolvedValueOnce(results[i]);

        const isValid = await verifyPassword(passwords[i], results[i].hash, results[i].salt);
        expect(isValid).toBe(true);
      }
    });

    it('should handle password reset token generation in workflow', async () => {
      // Generate reset token
      const mockArray = new Uint8Array(32);
      mockArray.set([10, 20, 30, 40, 50, 60, 70, 80]);
      mockCrypto.getRandomValues.mockReturnValue(mockArray);

      const resetToken = generatePasswordResetToken();
      expect(resetToken).toBeDefined();
      expect(resetToken.length).toBe(64);

      // Hash new password
      const newPassword = 'new-secure-password';
      const mockSalt = new Uint8Array(16);
      mockCrypto.getRandomValues.mockReturnValue(mockSalt);
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      const { hash, salt } = await hashPassword(newPassword);
      expect(hash).toBeDefined();
      expect(salt).toBeDefined();

      // Verify new password
      vi.clearAllMocks();
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));
      vi.mocked(hashPassword).mockResolvedValueOnce({ hash, salt });

      const isValid = await verifyPassword(newPassword, hash, salt);
      expect(isValid).toBe(true);
    });
  });

  describe('security considerations', () => {
    it('should use high iteration count for PBKDF2', async () => {
      const mockSalt = new Uint8Array(16);
      mockCrypto.getRandomValues.mockReturnValue(mockSalt);
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      await hashPassword('test-password');

      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        expect.objectContaining({
          iterations: 100000, // High iteration count for security
        }),
        expect.any(CryptoKey),
        256
      );
    });

    it('should use SHA-256 hash algorithm', async () => {
      const mockSalt = new Uint8Array(16);
      mockCrypto.getRandomValues.mockReturnValue(mockSalt);
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      await hashPassword('test-password');

      expect(mockCrypto.subtle.deriveBits).toHaveBeenCalledWith(
        expect.objectContaining({
          hash: 'SHA-256',
        }),
        expect.any(CryptoKey),
        256
      );
    });

    it('should generate cryptographically secure random tokens', () => {
      const mockArray = new Uint8Array(32);
      mockCrypto.getRandomValues.mockReturnValue(mockArray);

      const token = generatePasswordResetToken();

      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(token).toMatch(/^[0-9a-f]{64}$/); // 32 bytes = 64 hex chars
    });
  });

  describe('error handling edge cases', () => {
    it('should handle null password gracefully', async () => {
      const mockSalt = new Uint8Array(16);
      mockCrypto.getRandomValues.mockReturnValue(mockSalt);
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      // @ts-expect-error Testing null input
      const result = await hashPassword(null);
      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
    });

    it('should handle undefined password gracefully', async () => {
      const mockSalt = new Uint8Array(16);
      mockCrypto.getRandomValues.mockReturnValue(mockSalt);
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));

      // @ts-expect-error Testing undefined input
      const result = await hashPassword(undefined);
      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
    });

    it('should handle verifyPassword with null inputs', async () => {
      const result = await verifyPassword(null as any, null as any, null as any);
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle crypto.getRandomValues failure', () => {
      mockCrypto.getRandomValues.mockImplementation(() => {
        throw new Error('Random number generation failed');
      });

      expect(() => generatePasswordResetToken()).toThrow('Random number generation failed');
    });
  });
});
