import { describe, it, expect, beforeEach, vi } from 'vitest'
import { imagePrefetcher, type ImagePrefetchOptions } from '@/lib/image-prefetcher'

describe('ImagePrefetcher', () => {
  beforeEach(() => {
    imagePrefetcher.clearCache()
    vi.clearAllMocks()
  })

  describe('prefetch', () => {
    it('should prefetch an image successfully', async () => {
      const url = 'https://example.com/image.jpg'
      const img = new Image()
      vi.spyOn(window, 'Image').mockImplementation(() => img)
      
      const resultPromise = imagePrefetcher.prefetch(url)
      
      setTimeout(() => {
        Object.defineProperty(img, 'complete', { value: true, writable: true })
        img.onload?.({} as Event)
      }, 10)

      const result = await resultPromise
      expect(result.success).toBe(true)
      expect(result.url).toBe(url)
    })

    it('should handle prefetch errors', async () => {
      const url = 'https://example.com/invalid.jpg'
      const img = new Image()
      vi.spyOn(window, 'Image').mockImplementation(() => img)
      
      const resultPromise = imagePrefetcher.prefetch(url)
      
      setTimeout(() => {
        img.onerror?.({} as Event)
      }, 10)

      const result = await resultPromise
      expect(result.success).toBe(false)
      expect(result.url).toBe(url)
      expect(result.error).toBeDefined()
    })

    it('should cache prefetched images', async () => {
      const url = 'https://example.com/image.jpg'
      const img = new Image()
      vi.spyOn(window, 'Image').mockImplementation(() => img)
      
      const resultPromise1 = imagePrefetcher.prefetch(url)
      
      setTimeout(() => {
        Object.defineProperty(img, 'complete', { value: true, writable: true })
        img.onload?.({} as Event)
      }, 10)

      await resultPromise1
      expect(imagePrefetcher.isPrefetched(url)).toBe(true)

      const resultPromise2 = imagePrefetcher.prefetch(url)
      const result2 = await resultPromise2
      expect(result2.success).toBe(true)
    })

    it('should handle timeout', async () => {
      const url = 'https://example.com/slow.jpg'
      const img = new Image()
      vi.spyOn(window, 'Image').mockImplementation(() => img)
      
      const options: ImagePrefetchOptions = { timeout: 100 }
      const resultPromise = imagePrefetcher.prefetch(url, options)
      
      const result = await resultPromise
      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Image prefetch timeout')
    })
  })

  describe('prefetchBatch', () => {
    it('should prefetch multiple images', async () => {
      const urls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg'
      ]
      
      const results = await imagePrefetcher.prefetchBatch(urls)
      expect(results).toHaveLength(2)
      expect(results.every((r: { url: string }) => r.url !== undefined)).toBe(true)
    })
  })

  describe('isPrefetched', () => {
    it('should return false for non-prefetched images', () => {
      expect(imagePrefetcher.isPrefetched('https://example.com/new.jpg')).toBe(false)
    })
  })

  describe('clearCache', () => {
    it('should clear the prefetch cache', () => {
      imagePrefetcher.clearCache()
      expect(imagePrefetcher.isPrefetched('https://example.com/test.jpg')).toBe(false)
    })
  })
})

