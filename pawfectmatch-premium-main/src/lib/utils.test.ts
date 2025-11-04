import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, generateCorrelationId, generateULID } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2', 'py-2')).toBe('px-2 py-2');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isInactive = false;
      expect(cn('base', isActive && 'active', isInactive && 'inactive')).toBe('base active');
    });

    it('should merge tailwind classes with conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle arrays', () => {
      expect(cn(['px-2', 'py-2'], 'bg-blue')).toBe('px-2 py-2 bg-blue');
    });
  });

  describe('generateCorrelationId', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate a correlation ID', () => {
      const id = generateCorrelationId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp', () => {
      const now = Date.now();
      vi.setSystemTime(now);
      const id = generateCorrelationId();
      expect(id).toContain(now.toString());
    });

    it('should have consistent format', () => {
      const id = generateCorrelationId();
      const parts = id.split('-');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatch(/^\d+$/);
      expect(parts[1]).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('generateULID', () => {
    it('should generate a ULID', () => {
      const ulid = generateULID();
      expect(ulid).toBeTruthy();
      expect(typeof ulid).toBe('string');
    });

    it('should generate uppercase ULID', () => {
      const ulid = generateULID();
      expect(ulid).toBe(ulid.toUpperCase());
    });

    it('should generate unique ULIDs', () => {
      const ulid1 = generateULID();
      const ulid2 = generateULID();
      expect(ulid1).not.toBe(ulid2);
    });

    it('should have consistent length', () => {
      const ulid1 = generateULID();
      const ulid2 = generateULID();
      expect(ulid1.length).toBe(ulid2.length);
    });

    it('should contain timestamp component', () => {
      const ulid = generateULID();
      
      // ULID should contain timestamp in base36
      const timestampStr = ulid.substring(0, 8);
      expect(timestampStr).toMatch(/^[0-9A-Z]+$/);
    });
  });
});
