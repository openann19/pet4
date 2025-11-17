import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QuotaService, createQuotaService } from './quota-service';

describe('QuotaService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within daily limit', () => {
    const service = new QuotaService({
      dailyLimit: 100,
      resetAtMidnight: false,
    });

    const result = service.checkQuota('user1', 'action1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
    expect(result.limit).toBe(100);
    expect(result.used).toBe(1);
  });

  it('should reject requests exceeding daily limit', () => {
    const service = new QuotaService({
      dailyLimit: 2,
      resetAtMidnight: false,
    });

    service.checkQuota('user1', 'action1');
    service.checkQuota('user1', 'action1');
    const result = service.checkQuota('user1', 'action1');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.used).toBe(2);
  });

  it('should track quotas per user and action', () => {
    const service = new QuotaService({
      dailyLimit: 10,
      resetAtMidnight: false,
    });

    service.checkQuota('user1', 'action1');
    service.checkQuota('user1', 'action2');
    service.checkQuota('user2', 'action1');

    const result1 = service.getUsage('user1', 'action1');
    const result2 = service.getUsage('user1', 'action2');
    const result3 = service.getUsage('user2', 'action1');

    expect(result1.used).toBe(1);
    expect(result2.used).toBe(1);
    expect(result3.used).toBe(1);
  });

  it('should reset quota at midnight', () => {
    const service = new QuotaService({
      dailyLimit: 10,
      resetAtMidnight: true,
    });

    // Set time to 11:59 PM
    const date = new Date('2024-01-01T23:59:00Z');
    vi.setSystemTime(date);

    service.checkQuota('user1', 'action1');
    const result1 = service.getUsage('user1', 'action1');
    expect(result1.used).toBe(1);

    // Advance to next day (12:01 AM)
    const nextDay = new Date('2024-01-02T00:01:00Z');
    vi.setSystemTime(nextDay);

    const result2 = service.getUsage('user1', 'action1');
    expect(result2.used).toBe(0);
    expect(result2.allowed).toBe(true);
  });

  it('should reset quota manually', () => {
    const service = new QuotaService({
      dailyLimit: 10,
      resetAtMidnight: false,
    });

    service.checkQuota('user1', 'action1');
    service.resetQuota('user1', 'action1');

    const result = service.getUsage('user1', 'action1');
    expect(result.used).toBe(0);
    expect(result.allowed).toBe(true);
  });

  describe('createQuotaService', () => {
    it('should create service with daily limit', () => {
      const service = createQuotaService(100);
      const result = service.checkQuota('user1', 'action1');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(99);
    });
  });
});
