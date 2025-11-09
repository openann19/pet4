/**
 * Purchase Service Tests
 *
 * Comprehensive test suite for purchase receipt verification,
 * entitlement grants, refund handling, and business config management.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusinessConfig, Purchase } from '../business-types';
import { APIClient } from '../api-client';
import { getUserEntitlements } from '../entitlements-engine';
import {
  getBusinessConfig,
  handleRefund,
  updateBusinessConfig,
  verifyReceipt,
} from '../purchase-service';

type KVStore = Map<string, unknown>;

// Mock dependencies
vi.mock('../utils', () => ({
  generateULID: vi.fn(() => 'test-ulid-12345'),
}));

vi.mock('../entitlements-engine', () => ({
  getUserEntitlements: vi.fn(),
}));

vi.mock('../logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));
// Mock APIClient
vi.mock('../api-client', () => ({
  APIClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const kvStore: KVStore = new Map();

const kv = {
  get: vi.fn(<T,>(key: string): Promise<T | undefined> => {
    return Promise.resolve(kvStore.get(key) as T | undefined);
  }),
  set: vi.fn(<T,>(key: string, value: T): Promise<void> => {
    kvStore.set(key, value);
    return Promise.resolve();
  }),
  delete: vi.fn(async (key: string): Promise<void> => {
    kvStore.delete(key);
  }),
  keys: vi.fn(async (): Promise<string[]> => Array.from(kvStore.keys())),
};

beforeAll(() => {
  // Override global spark for testing
  (globalThis as unknown as { spark: unknown }).spark = {
    kv,
    llmPrompt: vi.fn(),
    llm: vi.fn(),
    user: vi.fn(),
  };

  
});

beforeEach(() => {
  kvStore.clear();
  vi.clearAllMocks();

  // Reset APIClient mocks
  vi.mocked(APIClient.post).mockReset();
  vi.mocked(APIClient.get).mockReset();
});

describe('verifyReceipt', () => {
  const userId = 'user-123';
  const receipt = 'test-receipt-123';

  describe('web platform (Stripe)', () => {
    it('should verify valid Stripe receipt and create purchase', async () => {
      const mockResponse: {
        valid: boolean;
        sku: string;
        type: string;
        receipt: string;
        expiresAt: string;
        amount: number;
        currency: string;
        transactionId: string;
      } = {
        valid: true,
        sku: 'premium_monthly',
        type: 'subscription',
        receipt: 'stripe_session_123',
        expiresAt: '2024-12-31T23:59:59Z',
        amount: 9.99,
        currency: 'USD',
        transactionId: 'txn_123',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('web', receipt, userId);

      expect(result).toEqual({
        valid: true,
        purchase: expect.objectContaining({
          id: 'test-ulid-12345',
          userId,
          sku: 'premium_monthly',
          type: 'subscription',
          platform: 'web',
          receipt: 'stripe_session_123',
          status: 'active',
          expiresAt: '2024-12-31T23:59:59Z',
          amount: 9.99,
          currency: 'USD',
          transactionId: 'txn_123',
          verifiedAt: expect.any(String),
        }),
      });

      expect(APIClient.post).toHaveBeenCalledWith('/payments/verify-receipt', { platform: 'web', receipt, userId });

      const savedPurchase = kvStore.get('purchase:test-ulid-12345') as Purchase;
      expect(savedPurchase).toBeDefined();
      expect(savedPurchase?.sku).toBe('premium_monthly');
    });

    it('should handle missing optional fields in Stripe response', async () => {
      const mockResponse: { valid: boolean; sku: string } = {
        valid: true,
        sku: 'premium_monthly',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('web', receipt, userId);

      expect(result.valid).toBe(true);
      expect(result.purchase).toBeDefined();
      expect(result.purchase?.sku).toBe('premium_monthly');
      expect(result.purchase?.currency).toBe('USD');
      expect(result.purchase?.receipt).toBe(receipt);
    });

    it('should return error for invalid Stripe receipt', async () => {
      const mockResponse: { valid: boolean; error: string } = {
        valid: false,
        error: 'Invalid receipt',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('web', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid receipt',
      });
    });

    it('should handle error response without error message for Stripe receipt', async () => {
      const mockResponse: { valid: boolean } = {
        valid: false,
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('web', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid receipt',
      });
    });

    it('should handle network errors', async () => {
      vi.mocked(APIClient.post).mockRejectedValueOnce(new Error('Network error'));

      const result = await verifyReceipt('web', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Network error',
      });
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(APIClient.post).mockRejectedValueOnce('String error');

      const result = await verifyReceipt('web', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Verification failed',
      });
    });

    it('should handle non-OK HTTP response', async () => {
      vi.mocked(APIClient.post).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await verifyReceipt('web', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Verification failed',
      });
    });

    it('should handle invalid response format', async () => {
      vi.mocked(APIClient.post).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      } as Response);

      const result = await verifyReceipt('web', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid response format',
      });
    });

    it('should handle invalid receipt with error message for web', async () => {
      const mockResponse: { valid: boolean; error: string } = {
        valid: false,
        error: 'Receipt validation failed',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('web', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Receipt validation failed',
      });
    });
  });

  describe('iOS platform (Apple)', () => {
    it('should verify valid Apple receipt and create purchase', async () => {
      const mockResponse: {
        valid: boolean;
        sku: string;
        type: string;
        receipt: string;
        expiresAt: string;
        amount: number;
        currency: string;
        transactionId: string;
      } = {
        valid: true,
        sku: 'premium_monthly',
        type: 'subscription',
        receipt: 'apple_receipt_123',
        expiresAt: '2024-12-31T23:59:59Z',
        amount: 9.99,
        currency: 'USD',
        transactionId: 'txn_123',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('ios', receipt, userId);

      expect(result).toEqual({
        valid: true,
        purchase: expect.objectContaining({
          platform: 'ios',
          receipt: 'apple_receipt_123',
        }),
      });

      expect(APIClient.post).toHaveBeenCalledWith('/payments/verify-receipt', { platform: 'ios', receipt, userId });
    });

    it('should handle default type for Apple receipt', async () => {
      const mockResponse: { valid: boolean; sku: string } = {
        valid: true,
        sku: 'premium_monthly',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('ios', receipt, userId);

      expect(result.purchase?.type).toBe('subscription');
    });

    it('should handle errors for Apple receipt', async () => {
      vi.mocked(APIClient.post).mockRejectedValueOnce(new Error('Apple API error'));

      const result = await verifyReceipt('ios', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Apple API error',
      });
    });

    it('should handle non-OK HTTP response for Apple receipt', async () => {
      vi.mocked(APIClient.post).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await verifyReceipt('ios', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Verification failed',
      });
    });

    it('should handle non-Error exceptions for Apple receipt', async () => {
      vi.mocked(APIClient.post).mockRejectedValueOnce('String error');

      const result = await verifyReceipt('ios', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Verification failed',
      });
    });

    it('should handle invalid Apple receipt with error message', async () => {
      const mockResponse: { valid: boolean; error: string } = {
        valid: false,
        error: 'Receipt expired',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('ios', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Receipt expired',
      });
    });

    it('should handle invalid Apple receipt without error message', async () => {
      const mockResponse: { valid: boolean } = {
        valid: false,
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('ios', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid receipt',
      });
    });

    it('should handle non-Error exceptions for Apple receipt', async () => {
      vi.mocked(APIClient.post).mockRejectedValueOnce('String error');

      const result = await verifyReceipt('ios', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Verification failed',
      });
    });

    it('should handle invalid response format for Apple receipt', async () => {
      vi.mocked(APIClient.post).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      } as Response);

      const result = await verifyReceipt('ios', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid response format',
      });
    });

    it('should handle error response without error message for Apple receipt', async () => {
      const mockResponse: { valid: boolean } = {
        valid: false,
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('ios', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid receipt',
      });
    });
  });

  describe('Android platform (Google Play)', () => {
    it('should verify valid Google Play receipt and create purchase', async () => {
      const mockResponse: {
        valid: boolean;
        sku: string;
        type: string;
        receipt: string;
        expiresAt: string;
        amount: number;
        currency: string;
        transactionId: string;
      } = {
        valid: true,
        sku: 'elite_yearly',
        type: 'subscription',
        receipt: 'google_receipt_123',
        expiresAt: '2024-12-31T23:59:59Z',
        amount: 199.99,
        currency: 'USD',
        transactionId: 'txn_123',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('android', receipt, userId);

      expect(result).toEqual({
        valid: true,
        purchase: expect.objectContaining({
          platform: 'android',
          receipt: 'google_receipt_123',
          sku: 'elite_yearly',
        }),
      });

      expect(APIClient.post).toHaveBeenCalledWith('/payments/verify-receipt', { platform: 'android', receipt, userId });
    });

    it('should handle consumable purchases (boost)', async () => {
      const mockResponse: {
        valid: boolean;
        sku: string;
        type: string;
        receipt: string;
      } = {
        valid: true,
        sku: 'boost_consumable',
        type: 'consumable',
        receipt: 'google_receipt_boost',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('android', receipt, userId);

      expect(result.valid).toBe(true);
      expect(result.purchase?.sku).toBe('boost_consumable');
      expect(result.purchase?.type).toBe('consumable');
    });

    it('should handle errors for Google Play receipt', async () => {
      vi.mocked(APIClient.post).mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      const result = await verifyReceipt('android', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Verification failed',
      });
    });

    it('should handle invalid Google Play response format', async () => {
      vi.mocked(APIClient.post).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      } as Response);

      const result = await verifyReceipt('android', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid response format',
      });
    });

    it('should handle invalid Google Play receipt with error message', async () => {
      const mockResponse: { valid: boolean; error: string } = {
        valid: false,
        error: 'Purchase not found',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('android', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Purchase not found',
      });
    });

    it('should handle invalid Google Play receipt without error message', async () => {
      const mockResponse: { valid: boolean } = {
        valid: false,
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      const result = await verifyReceipt('android', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid receipt',
      });
    });

    it('should handle network errors for Google Play receipt', async () => {
      vi.mocked(APIClient.post).mockRejectedValueOnce(new Error('Network error'));

      const result = await verifyReceipt('android', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Network error',
      });
    });

    it('should handle non-Error exceptions for Google Play receipt', async () => {
      vi.mocked(APIClient.post).mockRejectedValueOnce('String error');

      const result = await verifyReceipt('android', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Verification failed',
      });
    });

    it('should handle invalid Google Play response format', async () => {
      vi.mocked(APIClient.post).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      } as Response);

      const result = await verifyReceipt('android', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid response format',
      });
    });
  });

  describe('unsupported platform', () => {
    it('should return error for unsupported platform', async () => {
      const result = await verifyReceipt('unsupported' as 'ios', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Unsupported platform',
      });
    });
  });

  describe('error handling in verifyReceipt', () => {
    it('should catch and handle errors from platform verification', async () => {
      // Mock fetch to throw an error that would propagate
      vi.mocked(APIClient.post).mockImplementationOnce(() => {
        throw new Error('Network failure');
      });

      const result = await verifyReceipt('web', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Network failure',
      });
    });

    it('should handle non-Error exceptions in verifyReceipt', async () => {
      vi.mocked(APIClient.post).mockImplementationOnce(() => {
        throw 'String error';
      });

      const result = await verifyReceipt('web', receipt, userId);

      expect(result).toEqual({
        valid: false,
        error: 'Verification failed',
      });
    });
  });

  describe('grantEntitlements', () => {
    it('should grant premium plan for premium SKU', async () => {
      const mockResponse: { valid: boolean; sku: string } = {
        valid: true,
        sku: 'premium_monthly',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      await verifyReceipt('web', receipt, userId);

      const entitlements = kvStore.get('entitlements:user-123') as {
        plan: string;
        updatedAt: string;
      };
      expect(entitlements?.plan).toBe('premium');
    });

    it('should grant elite plan for elite SKU', async () => {
      const mockResponse: { valid: boolean; sku: string } = {
        valid: true,
        sku: 'elite_yearly',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      await verifyReceipt('web', receipt, userId);

      const entitlements = kvStore.get('entitlements:user-123') as {
        plan: string;
        updatedAt: string;
      };
      expect(entitlements?.plan).toBe('elite');
    });

    it('should not grant plan for consumable boost SKU', async () => {
      const mockResponse: { valid: boolean; sku: string } = {
        valid: true,
        sku: 'boost_consumable',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      await verifyReceipt('web', receipt, userId);

      const entitlements = kvStore.get('entitlements:user-123');
      expect(entitlements).toBeUndefined();
    });

    it('should not grant plan for consumable super_like SKU', async () => {
      const mockResponse: { valid: boolean; sku: string } = {
        valid: true,
        sku: 'super_like_consumable',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      await verifyReceipt('web', receipt, userId);

      const entitlements = kvStore.get('entitlements:user-123');
      expect(entitlements).toBeUndefined();
    });

    it('should default to free plan for unknown SKU', async () => {
      const mockResponse: { valid: boolean; sku: string } = {
        valid: true,
        sku: 'unknown_sku',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      await verifyReceipt('web', receipt, userId);

      const entitlements = kvStore.get('entitlements:user-123') as {
        plan: string;
        updatedAt: string;
      };
      expect(entitlements?.plan).toBe('free');
    });
  });

  describe('savePurchase', () => {
    it('should save purchase and index by user', async () => {
      const mockResponse: { valid: boolean; sku: string } = {
        valid: true,
        sku: 'premium_monthly',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      await verifyReceipt('web', receipt, userId);

      const purchase = kvStore.get('purchase:test-ulid-12345') as Purchase;
      expect(purchase).toBeDefined();

      const userPurchases = kvStore.get('purchase:user:user-123') as Purchase[];
      expect(userPurchases).toBeDefined();
      expect(Array.isArray(userPurchases)).toBe(true);
      expect(userPurchases.length).toBeGreaterThan(0);
    });

    it('should append to existing user purchases', async () => {
      const existingPurchase: Purchase = {
        id: 'existing-ulid',
        userId,
        sku: 'premium_monthly',
        type: 'subscription',
        platform: 'web',
        receipt: 'old-receipt',
        status: 'active',
        startedAt: new Date().toISOString(),
      };

      kvStore.set('purchase:user:user-123', [existingPurchase]);

      const mockResponse: { valid: boolean; sku: string } = {
        valid: true,
        sku: 'elite_yearly',
      };

      vi.mocked(APIClient.post).mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
      } as never);

      await verifyReceipt('web', receipt, userId);

      const userPurchases = kvStore.get('purchase:user:user-123') as Purchase[];
      expect(userPurchases.length).toBe(2);
      expect(userPurchases.some((p) => p.id === 'existing-ulid')).toBe(true);
      expect(userPurchases.some((p) => p.id === 'test-ulid-12345')).toBe(true);
    });
  });
});

describe('handleRefund', () => {
  const purchaseId = 'purchase-123';
  const userId = 'user-123';

  beforeEach(() => {
    // Mock getUserEntitlements to return premium plan
    vi.mocked(getUserEntitlements).mockResolvedValue({
      swipeDailyCap: 'unlimited',
      superLikesPerDay: 10,
      boostsPerWeek: 2,
      canSeeWhoLikedYou: true,
      videoCalls: true,
      advancedFilters: true,
      readReceipts: true,
      priorityRanking: true,
      profileReviewFastLane: true,
      adoptionListingLimit: 5,
    });
  });

  it('should handle refund for existing purchase', async () => {
    const purchase: Purchase = {
      id: purchaseId,
      userId,
      sku: 'premium_monthly',
      type: 'subscription',
      platform: 'web',
      receipt: 'receipt-123',
      status: 'active',
      startedAt: new Date().toISOString(),
    };

    kvStore.set(`purchase:${purchaseId}`, purchase);

    await handleRefund(purchaseId, 'Customer request');

    const updatedPurchase = kvStore.get(`purchase:${purchaseId}`) as Purchase;
    expect(updatedPurchase?.status).toBe('refunded');

    const entitlements = kvStore.get(`entitlements:${userId}`) as {
      plan: string;
      updatedAt: string;
    };
    expect(entitlements?.plan).toBe('free');

    const auditLog = kvStore.get('audit-log:list') as {
      id: string;
      action: string;
      userId: string;
      purchaseId: string;
      reason?: string;
    }[];
    expect(auditLog).toBeDefined();
    expect(Array.isArray(auditLog)).toBe(true);
    const refundEntry = auditLog.find(
      (e) => e.action === 'refund_processed' && e.purchaseId === purchaseId
    );
    expect(refundEntry).toBeDefined();
    expect(refundEntry?.reason).toBe('Customer request');
  });

  it('should handle refund for non-existent purchase gracefully', async () => {
    await handleRefund('non-existent-id', 'Test reason');

    const purchase = kvStore.get('purchase:non-existent-id');
    expect(purchase).toBeUndefined();
  });

  it('should not downgrade if user is not on unlimited plan', async () => {
    vi.mocked(getUserEntitlements).mockResolvedValue({
      swipeDailyCap: 5,
      superLikesPerDay: 0,
      boostsPerWeek: 0,
      canSeeWhoLikedYou: false,
      videoCalls: false,
      advancedFilters: false,
      readReceipts: false,
      priorityRanking: false,
      profileReviewFastLane: false,
      adoptionListingLimit: 1,
    });

    const purchase: Purchase = {
      id: purchaseId,
      userId,
      sku: 'premium_monthly',
      type: 'subscription',
      platform: 'web',
      receipt: 'receipt-123',
      status: 'active',
      startedAt: new Date().toISOString(),
    };

    kvStore.set(`purchase:${purchaseId}`, purchase);

    await handleRefund(purchaseId);

    const updatedPurchase = kvStore.get(`purchase:${purchaseId}`) as Purchase;
    expect(updatedPurchase?.status).toBe('refunded');

    // Entitlements should not be changed since user is not on unlimited plan
    const entitlements = kvStore.get(`entitlements:${userId}`);
    expect(entitlements).toBeUndefined();
  });

  it('should create audit log entry for refund', async () => {
    const purchase: Purchase = {
      id: purchaseId,
      userId,
      sku: 'premium_monthly',
      type: 'subscription',
      platform: 'web',
      receipt: 'receipt-123',
      status: 'active',
      startedAt: new Date().toISOString(),
    };

    kvStore.set(`purchase:${purchaseId}`, purchase);

    await handleRefund(purchaseId, 'Fraud detected');

    const auditLog = kvStore.get('audit-log:list') as {
      id: string;
      action: string;
      userId: string;
      purchaseId: string;
      reason?: string;
      timestamp: string;
    }[];

    expect(auditLog.length).toBeGreaterThan(0);
    const refundEntry = auditLog[auditLog.length - 1];
    expect(refundEntry).toBeDefined();
    expect(refundEntry?.action).toBe('refund_processed');
    expect(refundEntry?.userId).toBe(userId);
    expect(refundEntry?.purchaseId).toBe(purchaseId);
    expect(refundEntry?.reason).toBe('Fraud detected');
    expect(refundEntry?.timestamp).toBeDefined();
  });

  it('should limit audit log to 1000 entries', async () => {
    const purchase: Purchase = {
      id: purchaseId,
      userId,
      sku: 'premium_monthly',
      type: 'subscription',
      platform: 'web',
      receipt: 'receipt-123',
      status: 'active',
      startedAt: new Date().toISOString(),
    };

    kvStore.set(`purchase:${purchaseId}`, purchase);

    // Create initial audit log with 1000 entries
    const initialAuditLog = Array.from({ length: 1000 }, (_, i) => ({
      id: `audit-${i}`,
      timestamp: new Date().toISOString(),
      action: 'test',
      userId: 'test-user',
    }));

    kvStore.set('audit-log:list', initialAuditLog);

    await handleRefund(purchaseId, 'Test');

    const auditLog = kvStore.get('audit-log:list') as unknown[];
    expect(auditLog.length).toBe(1000);
  });

  it('should handle refund without reason', async () => {
    const refundPurchaseId = 'refund-purchase-123';
    const refundUserId = 'refund-user-123';
    const purchase: Purchase = {
      id: refundPurchaseId,
      userId: refundUserId,
      sku: 'premium_monthly',
      type: 'subscription',
      platform: 'web',
      receipt: 'receipt-123',
      status: 'active',
      startedAt: new Date().toISOString(),
    };

    kvStore.set(`purchase:${refundPurchaseId}`, purchase);

    await handleRefund(refundPurchaseId);

    const auditLog = kvStore.get('audit-log:list') as {
      id: string;
      action: string;
      userId: string;
      purchaseId: string;
      reason?: string;
    }[];
    const refundEntry = auditLog.find(
      (e) => e.action === 'refund_processed' && e.purchaseId === refundPurchaseId
    );
    expect(refundEntry).toBeDefined();
    expect(refundEntry?.reason).toBeUndefined();
  });
});

describe('getBusinessConfig', () => {
  it('should return existing business config', async () => {
    const config: BusinessConfig = {
      id: 'config-1',
      version: '1',
      prices: {
        premium: { monthly: 9.99, yearly: 99.99, currency: 'USD' },
        elite: { monthly: 19.99, yearly: 199.99, currency: 'USD' },
        boost: { price: 2.99, currency: 'USD' },
        superLike: { price: 0.99, currency: 'USD' },
      },
      limits: {
        free: { swipeDailyCap: 5, adoptionListingLimit: 1 },
        premium: { boostsPerWeek: 1, superLikesPerDay: 0 },
        elite: { boostsPerWeek: 2, superLikesPerDay: 10 },
      },
      experiments: {},
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    };

    kvStore.set('business-config:current', config);

    const result = await getBusinessConfig();

    expect(result).toEqual(config);
  });

  it('should return null if no config exists', async () => {
    const result = await getBusinessConfig();

    expect(result).toBeNull();
  });
});

describe('updateBusinessConfig', () => {
  const updatedBy = 'admin-123';

  it('should create new config when none exists', async () => {
    const partialConfig: Partial<BusinessConfig> = {
      prices: {
        premium: { monthly: 14.99, yearly: 149.99, currency: 'USD' },
        elite: { monthly: 29.99, yearly: 299.99, currency: 'USD' },
        boost: { price: 3.99, currency: 'USD' },
        superLike: { price: 1.99, currency: 'USD' },
      },
    };

    const result = await updateBusinessConfig(partialConfig, updatedBy);

    expect(result.id).toBe('test-ulid-12345');
    expect(result.version).toBe('1');
    expect(result.prices.premium.monthly).toBe(14.99);
    expect(result.updatedBy).toBe(updatedBy);
    expect(result.updatedAt).toBeDefined();

    const savedConfig = kvStore.get('business-config:current') as BusinessConfig;
    expect(savedConfig).toEqual(result);
  });

  it('should update existing config with version increment', async () => {
    const existingConfig: BusinessConfig = {
      id: 'config-1',
      version: '5',
      prices: {
        premium: { monthly: 9.99, yearly: 99.99, currency: 'USD' },
        elite: { monthly: 19.99, yearly: 199.99, currency: 'USD' },
        boost: { price: 2.99, currency: 'USD' },
        superLike: { price: 0.99, currency: 'USD' },
      },
      limits: {
        free: { swipeDailyCap: 5, adoptionListingLimit: 1 },
        premium: { boostsPerWeek: 1, superLikesPerDay: 0 },
        elite: { boostsPerWeek: 2, superLikesPerDay: 10 },
      },
      experiments: {},
      updatedAt: new Date().toISOString(),
      updatedBy: 'old-admin',
    };

    kvStore.set('business-config:current', existingConfig);

    const partialConfig: Partial<BusinessConfig> = {
      prices: {
        premium: { monthly: 12.99, yearly: 129.99, currency: 'USD' },
        elite: { monthly: 24.99, yearly: 249.99, currency: 'USD' },
        boost: { price: 4.99, currency: 'USD' },
        superLike: { price: 1.49, currency: 'USD' },
      },
    };

    const result = await updateBusinessConfig(partialConfig, updatedBy);

    expect(result.id).toBe('config-1');
    expect(result.version).toBe('6');
    expect(result.prices.premium.monthly).toBe(12.99);
    expect(result.updatedBy).toBe(updatedBy);
  });

  it('should merge partial config with existing config', async () => {
    const existingConfig: BusinessConfig = {
      id: 'config-1',
      version: '1',
      prices: {
        premium: { monthly: 9.99, yearly: 99.99, currency: 'USD' },
        elite: { monthly: 19.99, yearly: 199.99, currency: 'USD' },
        boost: { price: 2.99, currency: 'USD' },
        superLike: { price: 0.99, currency: 'USD' },
      },
      limits: {
        free: { swipeDailyCap: 5, adoptionListingLimit: 1 },
        premium: { boostsPerWeek: 1, superLikesPerDay: 0 },
        elite: { boostsPerWeek: 2, superLikesPerDay: 10 },
      },
      experiments: { test1: { enabled: true, rollout: 50, params: {} } },
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    };

    kvStore.set('business-config:current', existingConfig);

    const partialConfig: Partial<BusinessConfig> = {
      limits: {
        free: { swipeDailyCap: 10, adoptionListingLimit: 2 },
        premium: { boostsPerWeek: 2, superLikesPerDay: 5 },
        elite: { boostsPerWeek: 3, superLikesPerDay: 15 },
      },
    };

    const result = await updateBusinessConfig(partialConfig, updatedBy);

    expect(result.prices).toEqual(existingConfig.prices);
    expect(result.limits.free.swipeDailyCap).toBe(10);
    expect(result.experiments).toEqual(existingConfig.experiments);
  });

  it('should create audit log entry for config update', async () => {
    const partialConfig: Partial<BusinessConfig> = {
      prices: {
        premium: { monthly: 14.99, yearly: 149.99, currency: 'USD' },
        elite: { monthly: 29.99, yearly: 299.99, currency: 'USD' },
        boost: { price: 3.99, currency: 'USD' },
        superLike: { price: 1.99, currency: 'USD' },
      },
    };

    await updateBusinessConfig(partialConfig, updatedBy);

    const auditLog = kvStore.get('audit-log:list') as {
      id: string;
      action: string;
      userId: string;
      config?: BusinessConfig;
      timestamp: string;
    }[];

    expect(auditLog).toBeDefined();
    expect(Array.isArray(auditLog)).toBe(true);
    const configEntry = auditLog.find((e) => e.action === 'business_config_updated');
    expect(configEntry).toBeDefined();
    expect(configEntry?.userId).toBe(updatedBy);
    expect(configEntry?.config).toBeDefined();
  });

  it('should use default values when creating new config with empty partial', async () => {
    const result = await updateBusinessConfig({}, updatedBy);

    expect(result.id).toBe('test-ulid-12345');
    expect(result.version).toBe('1');
    expect(result.prices.premium.monthly).toBe(9.99);
    expect(result.prices.premium.yearly).toBe(99.99);
    expect(result.prices.elite.monthly).toBe(19.99);
    expect(result.prices.elite.yearly).toBe(199.99);
    expect(result.prices.boost.price).toBe(2.99);
    expect(result.prices.superLike.price).toBe(0.99);
    expect(result.limits.free.swipeDailyCap).toBe(5);
    expect(result.limits.free.adoptionListingLimit).toBe(1);
    expect(result.limits.premium.boostsPerWeek).toBe(1);
    expect(result.limits.premium.superLikesPerDay).toBe(0);
    expect(result.limits.elite.boostsPerWeek).toBe(2);
    expect(result.limits.elite.superLikesPerDay).toBe(10);
    expect(result.experiments).toEqual({});
  });

  it('should limit audit log to 1000 entries for config update', async () => {
    const initialAuditLog = Array.from({ length: 1000 }, (_, i) => ({
      id: `audit-${i}`,
      timestamp: new Date().toISOString(),
      action: 'test',
      userId: 'test-user',
    }));

    kvStore.set('audit-log:list', initialAuditLog);

    const partialConfig: Partial<BusinessConfig> = {
      prices: {
        premium: { monthly: 14.99, yearly: 149.99, currency: 'USD' },
        elite: { monthly: 29.99, yearly: 299.99, currency: 'USD' },
        boost: { price: 3.99, currency: 'USD' },
        superLike: { price: 1.99, currency: 'USD' },
      },
    };

    await updateBusinessConfig(partialConfig, updatedBy);

    const auditLog = kvStore.get('audit-log:list') as unknown[];
    expect(auditLog.length).toBe(1000);
  });
});

