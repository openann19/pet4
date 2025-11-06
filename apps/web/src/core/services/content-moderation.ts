/**
 * Content Moderation Service
 * 
 * Implements NSFW/profanity screening, content fingerprinting, and duplicate detection.
 * All content must pass moderation before being stored or displayed.
 */

import { createLogger } from '@/lib/logger'
import { getPhotoModerationConfig } from '@/lib/api-config'
import Filter from 'bad-words'
import * as toxicity from '@tensorflow-models/toxicity'
import { loadNSFWModel } from '@/lib/nsfw/loader'

const logger = createLogger('ContentModeration')

// Initialize models lazily
let toxicityModel: toxicity.ToxicityClassifier | null = null
let nsfwModel: Awaited<ReturnType<typeof loadNSFWModel>> | null = null
let modelsInitialized = false

// Bad words filter instance
const profanityFilter = new Filter()

export interface ContentModerationResult {
  passed: boolean
  nsfwScore: number
  profanityScore: number
  contentFingerprint: string
  blockedReasons: string[]
  requiresReview: boolean
}

export interface MediaModerationResult {
  passed: boolean
  nsfwScore: number
  contentFingerprint: string
  blockedReasons: string[]
  requiresReview: boolean
}

/**
 * Default thresholds - can be overridden by admin config
 */
const DEFAULT_NSFW_BLOCK_THRESHOLD = 0.9
const DEFAULT_PROFANITY_REVIEW_THRESHOLD = 0.5
const DEFAULT_PROFANITY_BLOCK_THRESHOLD = 0.8

async function getModerationConfig() {
  const config = await getPhotoModerationConfig()
  return {
    enabled: config?.enabled ?? true,
    autoReject: config?.autoReject ?? false,
    confidenceThreshold: config?.confidenceThreshold ?? DEFAULT_NSFW_BLOCK_THRESHOLD
  }
}


/**
 * Initialize ML models for content moderation
 * Models are loaded lazily on first use
 */
async function initializeModels(): Promise<void> {
  if (modelsInitialized) return

  try {
    // Load toxicity model for text profanity detection
    const threshold = 0.7
    toxicityModel = await toxicity.load(threshold, [
      'toxicity',
      'severe_toxicity',
      'identity_attack',
      'insult',
      'profanity',
      'threat',
      'sexual_explicit'
    ])
    logger.info('Toxicity model loaded successfully')

    // Load NSFW.js model dynamically from CDN (browser-only)
    try {
      nsfwModel = await loadNSFWModel()
      logger.info('NSFW model loaded successfully')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to load NSFW model', err, {
        errorMessage: err.message,
        errorStack: err.stack,
      })
      // Continue without NSFW model - will use fallback detection
      nsfwModel = null
    }

    modelsInitialized = true
  } catch (error) {
    logger.error('Failed to initialize moderation models', error instanceof Error ? error : new Error(String(error)))                                           
    // Continue without models - will fall back to keyword-based detection
  }
}

/**
 * Generate content fingerprint for duplicate detection
 * Uses SHA-256 hash of text content and media URLs
 */
export async function generateContentFingerprint(text: string, mediaUrls: readonly string[]): Promise<string> {
  const content = `${text.trim().toLowerCase()}|${[...mediaUrls].sort().join('|')}`
  
  try {
    // Use crypto.subtle for secure hashing
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return `fp_${hashHex.substring(0, 16)}`
  } catch (error) {
    // Fallback to simple hash if crypto.subtle is unavailable
    logger.warn('crypto.subtle not available, using fallback hash', error instanceof Error ? error : new Error(String(error)))
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `fp_${Math.abs(hash).toString(36)}`
  }
}

/**
 * Check for profanity in text using bad-words library and TensorFlow toxicity model
 * Returns score between 0 and 1
 */
async function detectProfanity(text: string): Promise<number> {
  if (!text || text.trim().length === 0) return 0

  try {
    // Initialize models if not already loaded
    await initializeModels()

    // First check using bad-words library (fast, keyword-based)
    const isProfane = profanityFilter.isProfane(text)
    if (isProfane) {
      return 0.8 // High score for detected profanity
    }

    // If models are available, use TensorFlow toxicity model
    if (toxicityModel) {
      const predictions = await toxicityModel.classify([text])
      
      // Combine scores from different toxicity categories
      const toxicCategories = ['toxicity', 'severe_toxicity', 'profanity', 'insult', 'sexual_explicit']
      let maxScore = 0
      
      for (const prediction of predictions) {
        if (toxicCategories.includes(prediction.label)) {
          const match = prediction.results[0]
          if (match && match.match) {
            maxScore = Math.max(maxScore, match.probabilities[1] || 0)
          }
        }
      }

      return maxScore
    }

    // Fallback: basic keyword check
    const lowerText = text.toLowerCase()
    const profanityKeywords = ['damn', 'hell', 'crap', 'stupid', 'idiot']
    const matches = profanityKeywords.filter(keyword => lowerText.includes(keyword)).length
    
    if (matches > 0) {
      return Math.min(matches * 0.2, 0.6) // Moderate score for keyword matches
    }

    return 0
  } catch (error) {
    logger.error('Error in profanity detection', error instanceof Error ? error : new Error(String(error)))
    // On error, use basic keyword check
    const isProfane = profanityFilter.isProfane(text)
    return isProfane ? 0.5 : 0
  }
}

/**
 * Detect NSFW content in text using TensorFlow toxicity model
 * Returns score between 0 and 1
 */
async function detectNSFWText(text: string): Promise<number> {
  if (!text || text.trim().length === 0) return 0

  try {
    // Initialize models if not already loaded
    await initializeModels()

    // Use TensorFlow toxicity model for sexual explicit content
    if (toxicityModel) {
      const predictions = await toxicityModel.classify([text])
      
      // Look for sexual explicit category
      const sexualExplicit = predictions.find(p => p.label === 'sexual_explicit')
      if (sexualExplicit && sexualExplicit.results[0]?.match) {
        return sexualExplicit.results[0].probabilities[1] || 0
      }
    }

    // Fallback: keyword-based detection
    const nsfwKeywords = [
      'explicit', 'adult', 'nsfw', 'xxx', 'porn', 'sexual', 'nude', 'naked'
    ]
    
    const lowerText = text.toLowerCase()
    const matches = nsfwKeywords.filter(keyword => lowerText.includes(keyword)).length
    
    return Math.min(matches * 0.2, 0.7) // Max 0.7 for keyword matches (requires review)
  } catch (error) {
    logger.error('Error in NSFW text detection', error instanceof Error ? error : new Error(String(error)))
    // On error, use keyword fallback
    const nsfwKeywords = ['explicit', 'adult', 'nsfw', 'xxx', 'porn', 'sexual']
    const lowerText = text.toLowerCase()
    const matches = nsfwKeywords.filter(keyword => lowerText.includes(keyword)).length
    return Math.min(matches * 0.2, 0.5)
  }
}

/**
 * Detect NSFW content in media using NSFW.js model
 * Returns score between 0 and 1
 */
async function detectNSFWMedia(mediaUrl: string, mediaType: 'image' | 'video'): Promise<number> {
  try {
    // Initialize models if not already loaded
    await initializeModels()

    if (!nsfwModel) {
      logger.warn('NSFW model not available, skipping media moderation')
      return 0 // Assume safe if model unavailable
    }

    // Only process images for now (NSFW.js primarily supports images)
    if (mediaType !== 'image') {
      logger.debug('Video moderation not fully supported, using basic check', { mediaUrl })
      // For videos, we would need to extract frames and analyze each frame
      // For now, return a conservative score
      return 0.3 // Requires review for videos
    }

    // Load image
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = mediaUrl
    })

    // Classify image
    const predictions = await nsfwModel.classify(img)
    
    // Get NSFW categories: Porn, Hentai, Sexy
    const nsfwCategories = ['Porn', 'Hentai', 'Sexy']
    let maxScore = 0
    
    for (const pred of predictions) {
      if (nsfwCategories.includes(pred.className)) {
        maxScore = Math.max(maxScore, pred.probability)
      }
    }

    logger.debug('Media NSFW detection completed', {
      mediaUrl,
      maxScore,
      predictions: predictions.map((p: { className: string; probability: number }) => ({ className: p.className, probability: p.probability }))
    })

    return maxScore
  } catch (error) {
    logger.error('Failed to analyze media for NSFW content', error instanceof Error ? error : new Error(String(error)), {
      mediaUrl,
      mediaType
    })
    // On error, require review to be safe
    return 0.5
  }
}

/**
 * Moderate text content
 */
export async function moderateTextContent(text: string): Promise<ContentModerationResult> {
  const moderationConfig = await getModerationConfig()
  
  if (!moderationConfig.enabled) {
    // Moderation disabled - auto-pass
    return {
      passed: true,
      nsfwScore: 0,
      profanityScore: 0,
      contentFingerprint: await generateContentFingerprint(text, []),
      blockedReasons: [],
      requiresReview: false
    }
  }
  
  const blockThreshold = moderationConfig.confidenceThreshold
  const reviewThreshold = blockThreshold * 0.8 // Review at 80% of block threshold
  
  const [nsfwScore, profanityScore, contentFingerprint] = await Promise.all([
    detectNSFWText(text),
    detectProfanity(text),
    generateContentFingerprint(text, [])
  ])
  
  const blockedReasons: string[] = []
  let requiresReview = false
  
  if (nsfwScore >= blockThreshold || profanityScore >= DEFAULT_PROFANITY_BLOCK_THRESHOLD) {
    blockedReasons.push('Content violates community guidelines')
    return {
      passed: !moderationConfig.autoReject,
      nsfwScore,
      profanityScore,
      contentFingerprint,
      blockedReasons,
      requiresReview: false
    }
  }
  
  if (nsfwScore >= reviewThreshold || profanityScore >= DEFAULT_PROFANITY_REVIEW_THRESHOLD) {
    requiresReview = true
    if (nsfwScore >= reviewThreshold) {
      blockedReasons.push('NSFW content detected - requires review')
    }
    if (profanityScore >= DEFAULT_PROFANITY_REVIEW_THRESHOLD) {
      blockedReasons.push('Profanity detected - requires review')
    }
  }
  
  return {
    passed: true,
    nsfwScore,
    profanityScore,
    contentFingerprint,
    blockedReasons,
    requiresReview
  }
}

/**
 * Moderate media content
 */
export async function moderateMediaContent(
  mediaUrl: string,
  mediaType: 'image' | 'video'
): Promise<MediaModerationResult> {
  const moderationConfig = await getModerationConfig()
  
  if (!moderationConfig.enabled) {
    // Moderation disabled - auto-pass
    return {
      passed: true,
      nsfwScore: 0,
      contentFingerprint: await generateContentFingerprint('', [mediaUrl]),
      blockedReasons: [],
      requiresReview: false
    }
  }
  
  const blockThreshold = moderationConfig.confidenceThreshold
  const reviewThreshold = blockThreshold * 0.8
  
  const [nsfwScore, contentFingerprint] = await Promise.all([
    detectNSFWMedia(mediaUrl, mediaType),
    generateContentFingerprint('', [mediaUrl])
  ])
  
  const blockedReasons: string[] = []
  let requiresReview = false
  
  if (nsfwScore >= blockThreshold) {
    blockedReasons.push('Media violates community guidelines')
    return {
      passed: !moderationConfig.autoReject,
      nsfwScore,
      contentFingerprint,
      blockedReasons,
      requiresReview: false
    }
  }
  
  if (nsfwScore >= reviewThreshold) {
    requiresReview = true
    blockedReasons.push('NSFW content detected - requires review')
  }
  
  return {
    passed: true,
    nsfwScore,
    contentFingerprint,
    blockedReasons,
    requiresReview
  }
}

/**
 * Moderate complete post (text + media)
 */
export async function moderatePost(
  text: string,
  mediaUrls: string[]
): Promise<ContentModerationResult> {
  // Moderate text
  const textModeration = await moderateTextContent(text)
  
  // Moderate all media
  const mediaResults = await Promise.all(
    mediaUrls.map(url => moderateMediaContent(url, 'image'))
  )
  
  // Combine results
  const maxNSFWScore = Math.max(
    textModeration.nsfwScore,
    ...mediaResults.map(r => r.nsfwScore)
  )
  
  const contentFingerprint = await generateContentFingerprint(text, mediaUrls)
  
  const blockedReasons = [
    ...textModeration.blockedReasons,
    ...mediaResults.flatMap(r => r.blockedReasons)
  ]
  
  const requiresReview = textModeration.requiresReview || 
    mediaResults.some(r => r.requiresReview)
  
  const passed = textModeration.passed && 
    mediaResults.every(r => r.passed)
  
  return {
    passed,
    nsfwScore: maxNSFWScore,
    profanityScore: textModeration.profanityScore,
    contentFingerprint,
    blockedReasons,
    requiresReview
  }
}

/**
 * Check for duplicate content using fingerprint
 */
export async function checkDuplicateContent(
  fingerprint: string,
  existingFingerprints: Set<string>
): Promise<boolean> {
  return existingFingerprints.has(fingerprint)
}

