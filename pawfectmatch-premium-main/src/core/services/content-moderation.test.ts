/**
 * Content Moderation Service Tests
 */

import { describe, it, expect } from 'vitest'
import {
  moderateTextContent,
  moderateMediaContent,
  moderatePost,
  generateContentFingerprint,
  checkDuplicateContent
} from './content-moderation'

// Default thresholds for testing (matches admin config defaults)
const DEFAULT_NSFW_REVIEW_THRESHOLD = 0.56 // 80% of 0.7
const DEFAULT_NSFW_BLOCK_THRESHOLD = 0.9
const DEFAULT_PROFANITY_REVIEW_THRESHOLD = 0.5

describe('ContentModeration', () => {
  describe('generateContentFingerprint', () => {
    it('should generate consistent fingerprints for same content', () => {
      const text1 = 'Hello world'
      const text2 = 'Hello world'
      const media1 = ['url1', 'url2']
      const media2 = ['url1', 'url2']
      
      const fp1 = generateContentFingerprint(text1, media1)
      const fp2 = generateContentFingerprint(text2, media2)
      
      expect(fp1).toBe(fp2)
      expect(fp1).toMatch(/^fp_/)
    })
    
    it('should generate different fingerprints for different content', () => {
      const fp1 = generateContentFingerprint('Hello', ['url1'])
      const fp2 = generateContentFingerprint('World', ['url2'])
      
      expect(fp1).not.toBe(fp2)
    })
    
    it('should handle empty content', () => {
      const fp = generateContentFingerprint('', [])
      expect(fp).toBeTruthy()
      expect(fp).toMatch(/^fp_/)
    })
  })
  
  describe('moderateTextContent', () => {
    it('should pass safe content', async () => {
      const result = await moderateTextContent('This is a safe post about pets')
      
      expect(result.passed).toBe(true)
      expect(result.nsfwScore).toBeLessThan(DEFAULT_NSFW_REVIEW_THRESHOLD)
      expect(result.profanityScore).toBeLessThan(DEFAULT_PROFANITY_REVIEW_THRESHOLD)
      expect(result.blockedReasons).toHaveLength(0)
      expect(result.requiresReview).toBe(false)
      expect(result.contentFingerprint).toBeTruthy()
    })
    
    it('should require review for borderline NSFW content', async () => {
      const result = await moderateTextContent('This is explicit content about adult topics')
      
      expect(result.nsfwScore).toBeGreaterThanOrEqual(DEFAULT_NSFW_REVIEW_THRESHOLD)
      expect(result.requiresReview).toBe(true)
      expect(result.blockedReasons.length).toBeGreaterThan(0)
    })
    
    it('should handle empty text', async () => {
      const result = await moderateTextContent('')
      
      expect(result.passed).toBe(true)
      expect(result.nsfwScore).toBe(0)
      expect(result.profanityScore).toBe(0)
    })
  })
  
  describe('moderateMediaContent', () => {
        it('should pass safe media', async () => {
      const result = await moderateMediaContent('https://example.com/safe-image.jpg', 'image')                                                                  
      
      expect(result.passed).toBe(true)
      expect(result.nsfwScore).toBeLessThan(DEFAULT_NSFW_BLOCK_THRESHOLD)
      expect(result.contentFingerprint).toBeTruthy()
    })
    
    it('should generate fingerprint for media', async () => {
      const result = await moderateMediaContent('https://example.com/image.jpg', 'image')
      
      expect(result.contentFingerprint).toBeTruthy()
      expect(result.contentFingerprint).toMatch(/^fp_/)
    })
  })
  
  describe('moderatePost', () => {
    it('should pass safe posts', async () => {
      const result = await moderatePost(
        'This is a safe post about my pet',
        ['https://example.com/pet.jpg']
      )
      
      expect(result.passed).toBe(true)
      expect(result.nsfwScore).toBeLessThan(DEFAULT_NSFW_BLOCK_THRESHOLD)
      expect(result.contentFingerprint).toBeTruthy()
    })
    
    it('should combine text and media moderation', async () => {
      const result = await moderatePost(
        'Safe text',
        ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      )
      
      expect(result.passed).toBe(true)
      expect(result.contentFingerprint).toBeTruthy()
    })
    
    it('should handle posts without media', async () => {
      const result = await moderatePost('Text only post', [])
      
      expect(result.passed).toBe(true)
      expect(result.contentFingerprint).toBeTruthy()
    })
    
    it('should handle posts without text', async () => {
      const result = await moderatePost('', ['https://example.com/image.jpg'])
      
      expect(result.passed).toBe(true)
      expect(result.contentFingerprint).toBeTruthy()
    })
  })
  
  describe('checkDuplicateContent', () => {
    it('should detect duplicate content', async () => {
      const fingerprint = 'fp_test123'
      const existing = new Set(['fp_test123', 'fp_other'])
      
      const isDuplicate = await checkDuplicateContent(fingerprint, existing)
      
      expect(isDuplicate).toBe(true)
    })
    
    it('should not detect non-duplicate content', async () => {
      const fingerprint = 'fp_unique'
      const existing = new Set(['fp_test123', 'fp_other'])
      
      const isDuplicate = await checkDuplicateContent(fingerprint, existing)
      
      expect(isDuplicate).toBe(false)
    })
    
    it('should handle empty fingerprint set', async () => {
      const fingerprint = 'fp_test'
      const existing = new Set<string>()
      
      const isDuplicate = await checkDuplicateContent(fingerprint, existing)
      
      expect(isDuplicate).toBe(false)
    })
  })
})

