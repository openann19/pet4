/**
 * Advanced Matching System
 *
 * AI-powered compatibility analysis and matching
 */

import type { Pet } from '@petspark/shared'

export interface CompatibilityScore {
  overall: number
  personality: number
  behavioral: number
  photo: number
  lifestyle: number
}

export interface MatchExplanation {
  summary: string
  strengths: string[]
  considerations: string[]
  aiInsights: string[]
}

export interface BehavioralPattern {
  pattern: string
  confidence: number
  description: string
}

export interface PersonalityAnalysis {
  traits: Array<{ trait: string; score: number }>
  compatibility: number
  notes: string
}

export interface PhotoAnalysis {
  quality: number
  authenticity: number
  petCharacteristics: string[]
}

export interface AdvancedMatchResult {
  pet: Pet
  compatibilityScore: CompatibilityScore
  explanation: MatchExplanation
  behavioralPatterns: BehavioralPattern[]
  personalityAnalysis: PersonalityAnalysis
  photoAnalysis?: PhotoAnalysis
}

/**
 * Analyze personality compatibility between two pets
 */
export function analyzePersonalityCompatibility(pet1: Pet, pet2: Pet): PersonalityAnalysis {
  const traits1 = Array.isArray(pet1.personality) ? pet1.personality : []
  const traits2 = Array.isArray(pet2.personality) ? pet2.personality : []

  const commonTraits = traits1.filter((trait: string) => traits2.includes(trait))
  const compatibility =
    traits1.length > 0 && traits2.length > 0
      ? (commonTraits.length / Math.max(traits1.length, traits2.length)) * 100
      : 50

  const traitScores = [...new Set([...traits1, ...traits2])].map(trait => ({
    trait,
    score: traits1.includes(trait) && traits2.includes(trait) ? 100 : 50,
  }))

  return {
    traits: traitScores,
    compatibility: Math.round(compatibility),
    notes:
      commonTraits.length > 0
        ? `Both pets share ${commonTraits.length} personality trait${commonTraits.length !== 1 ? 's' : ''}.`
        : 'Pets have complementary personalities.',
  }
}

/**
 * Detect behavioral patterns from pet data
 */
export function detectBehavioralPatterns(pet: Pet): BehavioralPattern[] {
  const patterns: BehavioralPattern[] = []

  if (pet.interests && Array.isArray(pet.interests)) {
    if (pet.interests.includes('outdoor')) {
      patterns.push({
        pattern: 'Outdoor Activity Preference',
        confidence: 0.85,
        description: 'Pet shows strong preference for outdoor activities.',
      })
    }
  }

  if (pet.age && pet.age < 2) {
    patterns.push({
      pattern: 'Young Pet Behavior',
      confidence: 0.9,
      description: 'Young pet likely to be energetic and playful.',
    })
  }

  return patterns
}

/**
 * Analyze photo quality and authenticity
 */
export function analyzePhoto(photoUrl: string): PhotoAnalysis {
  // In a real implementation, this would use image analysis APIs
  return {
    quality: 0.85,
    authenticity: 0.9,
    petCharacteristics: ['clear', 'well-lit', 'good composition'],
  }
}

/**
 * Generate AI-powered match explanation
 */
export function generateMatchExplanation(
  pet1: Pet,
  pet2: Pet,
  compatibilityScore: CompatibilityScore
): MatchExplanation {
  const strengths: string[] = []
  const considerations: string[] = []
  const aiInsights: string[] = []

  if (compatibilityScore.personality > 70) {
    strengths.push('Strong personality compatibility')
    aiInsights.push('Both pets have complementary temperaments that should work well together.')
  }

  if (compatibilityScore.behavioral > 75) {
    strengths.push('Similar behavioral patterns')
  }

  if (pet1.size && pet2.size && pet1.size === pet2.size) {
    strengths.push('Similar size - safe for play')
  } else if (pet1.size && pet2.size) {
    considerations.push('Size difference may require supervision during initial meetings')
  }

  if (compatibilityScore.overall > 80) {
    aiInsights.push('High compatibility score suggests these pets would make great playmates.')
  }

  const summary = `These pets show ${compatibilityScore.overall}% compatibility based on personality, behavior, and lifestyle factors.`

  return {
    summary,
    strengths,
    considerations,
    aiInsights,
  }
}

/**
 * Calculate advanced compatibility score
 */
export function calculateAdvancedCompatibility(pet1: Pet, pet2: Pet): AdvancedMatchResult {
  const personalityAnalysis = analyzePersonalityCompatibility(pet1, pet2)
  const behavioralPatterns1 = detectBehavioralPatterns(pet1)
  const behavioralPatterns2 = detectBehavioralPatterns(pet2)

  const compatibilityScore: CompatibilityScore = {
    overall: Math.round(
      personalityAnalysis.compatibility * 0.4 +
        (behavioralPatterns1.length > 0 ? 75 : 50) * 0.3 +
        80 * 0.2 + // photo score placeholder
        70 * 0.1 // lifestyle score placeholder
    ),
    personality: personalityAnalysis.compatibility,
    behavioral: behavioralPatterns1.length > 0 ? 75 : 50,
    photo: 80, // placeholder
    lifestyle: 70, // placeholder
  }

  const explanation = generateMatchExplanation(pet1, pet2, compatibilityScore)

  return {
    pet: pet2,
    compatibilityScore,
    explanation,
    behavioralPatterns: [...behavioralPatterns1, ...behavioralPatterns2],
    personalityAnalysis,
  }
}
