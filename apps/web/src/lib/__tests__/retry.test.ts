/**
 * Tests for retry utility
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retry, type RetryOptions } from '../retry';

vi.mock('../logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await retry(fn, { attempts: 3, delay: 100 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed on second attempt', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('first failure'))
      .mockResolvedValueOnce('success');

    const promise = retry(fn, { attempts: 3, delay: 100 });

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should retry with exponential backoff', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('first failure'))
      .mockRejectedValueOnce(new Error('second failure'))
      .mockResolvedValueOnce('success');

    const onRetry = vi.fn();
    const options: RetryOptions = {
      attempts: 3,
      delay: 100,
      exponentialBackoff: true,
      onRetry,
    };

    const promise = retry(fn, options);

    await vi.advanceTimersByTimeAsync(0);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);

    await vi.advanceTimersByTimeAsync(100);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2);

    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after all attempts fail', async () => {
    // Use real timers here to avoid unhandled rejections under fake timers
    vi.useRealTimers();

    const error = new Error('persistent failure');
    const fn = vi.fn().mockRejectedValue(error);

    await expect(retry(fn, { attempts: 3, delay: 5 })).rejects.toThrow('persistent failure');

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should call onRetry callback for each retry', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('first failure'))
      .mockRejectedValueOnce(new Error('second failure'))
      .mockResolvedValueOnce('success');

    const onRetry = vi.fn();
    const promise = retry(fn, {
      attempts: 3,
      delay: 100,
      onRetry,
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);

    await vi.advanceTimersByTimeAsync(100);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2);

    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;

    expect(result).toBe('success');
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('should handle non-Error values in catch', async () => {
    const fn = vi.fn().mockRejectedValueOnce('string error').mockResolvedValueOnce('success');

    const promise = retry(fn, { attempts: 3, delay: 100 });

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should handle object with message property', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ message: 'object error' })
      .mockResolvedValueOnce('success');

    const promise = retry(fn, { attempts: 3, delay: 100 });

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should use constant delay when exponentialBackoff is false', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('first failure'))
      .mockRejectedValueOnce(new Error('second failure'))
      .mockResolvedValueOnce('success');

    const startTime = Date.now();
    const promise = retry(fn, {
      attempts: 3,
      delay: 100,
      exponentialBackoff: false,
    });

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;
    const endTime = Date.now();

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(endTime - startTime).toBeLessThan(300);
  });
});
