import { describe, it, expect, beforeEach, vi } from 'vitest';
import { imagePrefetcher, type ImagePrefetchOptions } from '@/lib/image-prefetcher';

describe('ImagePrefetcher', () => {
  beforeEach(() => {
    imagePrefetcher.clearCache();
    vi.clearAllMocks();
    // Reset MockImage instances between tests
    const MockImageClass = (global as any).Image;
    if (MockImageClass && MockImageClass.instances) {
      MockImageClass.instances = [];
    }
  });

  describe('prefetch', () => {
    it('should prefetch an image successfully', async () => {
      const url = 'https://example.com/image.jpg';

      const resultPromise = imagePrefetcher.prefetch(url);

      // Simulate successful image loading by triggering the global Image mock's onload
      setTimeout(() => {
        // The imagePrefetcher creates its own Image instance, we just need to trigger its callback
        const MockImageClass = (global as any).Image;
        const img = MockImageClass.instances[MockImageClass.instances.length - 1]; // Get the most recent Image instance
        if (img) {
          Object.defineProperty(img, 'complete', { value: true, writable: true });
          img.onload?.({} as Event);
        }
      }, 10);

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(result.url).toBe(url);
    });

    it('should handle prefetch errors', async () => {
      const url = 'https://example.com/invalid.jpg';

      const resultPromise = imagePrefetcher.prefetch(url);

      setTimeout(() => {
        // Get the most recent Image instance and trigger its onerror callback
        const MockImageClass = (global as any).Image;
        const img = MockImageClass.instances[MockImageClass.instances.length - 1];
        if (img) {
          img.onerror?.({} as Event);
        }
      }, 10);

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.url).toBe(url);
      expect(result.error).toBeDefined();
    });

    it('should cache prefetched images', async () => {
      const url = 'https://example.com/image.jpg';

      const resultPromise1 = imagePrefetcher.prefetch(url);

      setTimeout(() => {
        // Get the most recent Image instance and trigger its onload callback
        const MockImageClass = (global as any).Image;
        const img = MockImageClass.instances[MockImageClass.instances.length - 1];
        if (img) {
          Object.defineProperty(img, 'complete', { value: true, writable: true });
          img.onload?.({} as Event);
        }
      }, 10);

      await resultPromise1;
      expect(imagePrefetcher.isPrefetched(url)).toBe(true);

      const resultPromise2 = imagePrefetcher.prefetch(url);
      const result2 = await resultPromise2;
      expect(result2.success).toBe(true);
    });

    it('should handle timeout', async () => {
      const url = 'https://example.com/slow.jpg';

      const options: ImagePrefetchOptions = { timeout: 100 };
      const resultPromise = imagePrefetcher.prefetch(url, options);

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Image prefetch timeout');
    });
  });

  describe('prefetchBatch', () => {
    it('should prefetch multiple images', async () => {
      const urls = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];

      const resultPromise = imagePrefetcher.prefetchBatch(urls);

      // Simulate successful image loading for all images in the batch
      setTimeout(() => {
        const MockImageClass = (global as any).Image;
        // Trigger onload for all Image instances created by the batch
        MockImageClass.instances.forEach((img: any) => {
          Object.defineProperty(img, 'complete', { value: true, writable: true });
          img.onload?.({} as Event);
        });
      }, 10);

      const results = await resultPromise;
      expect(results).toHaveLength(2);
      expect(results.every((r: { url: string }) => r.url !== undefined)).toBe(true);
    });
  });

  describe('isPrefetched', () => {
    it('should return false for non-prefetched images', () => {
      expect(imagePrefetcher.isPrefetched('https://example.com/new.jpg')).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear the prefetch cache', () => {
      imagePrefetcher.clearCache();
      expect(imagePrefetcher.isPrefetched('https://example.com/test.jpg')).toBe(false);
    });
  });
});
