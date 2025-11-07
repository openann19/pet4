import { buildLLMPrompt } from './llm-prompt'
import { llmService } from './llm-service'
import { logger } from './logger'
import type { CompatibilityFactors, Pet } from './types'

const PERSONALITY_COMPATIBILITY: Record<string, string[]> = {
  'playful': ['energetic', 'playful', 'adventurous', 'social'],
  'calm': ['gentle', 'calm', 'quiet', 'relaxed'],
  'energetic': ['playful', 'energetic', 'active', 'adventurous'],
  'gentle': ['calm', 'gentle', 'affectionate', 'quiet'],
  'social': ['playful', 'social', 'friendly', 'outgoing'],
  'independent': ['independent', 'calm', 'confident'],
  'affectionate': ['gentle', 'affectionate', 'cuddly', 'loving'],
  'curious': ['playful', 'curious', 'intelligent', 'adventurous'],
  'protective': ['loyal', 'protective', 'confident'],
  'loyal': ['loyal', 'protective', 'affectionate'],
}

const SIZE_COMPATIBILITY: Record<string, string[]> = {
  'small': ['small', 'medium'],
  'medium': ['small', 'medium', 'large'],
  'large': ['medium', 'large', 'extra-large'],
  'extra-large': ['large', 'extra-large'],
}

export function calculateCompatibility(userPet: Pet, otherPet: Pet): number {
  const factors = getCompatibilityFactors(userPet, otherPet)
  
  const weights = {
    sizeMatch: 0.25,
    personalityMatch: 0.30,
    interestMatch: 0.20,
    ageCompatibility: 0.15,
    locationProximity: 0.10,
  }

  let score = 
    factors.sizeMatch * weights.sizeMatch +
    factors.personalityMatch * weights.personalityMatch +
    factors.interestMatch * weights.interestMatch +
    factors.ageCompatibility * weights.ageCompatibility +
    factors.locationProximity * weights.locationProximity

  const verificationBonus = otherPet.verified ? 0.15 : 0
  score = Math.min(score + verificationBonus, 1)

  return Math.round(score * 100)
}

export function getCompatibilityFactors(userPet: Pet, otherPet: Pet): CompatibilityFactors {
  return {
    sizeMatch: calculateSizeMatch(userPet.size, otherPet.size),
    personalityMatch: calculatePersonalityMatch(userPet.personality, otherPet.personality),
    interestMatch: calculateInterestMatch(userPet.interests, otherPet.interests),
    ageCompatibility: calculateAgeCompatibility(userPet.age, otherPet.age),
    locationProximity: 0.8,
  }
}

function calculateSizeMatch(size1: string, size2: string): number {
  const compatible = SIZE_COMPATIBILITY[size1] || []
  return compatible.includes(size2) ? 1 : 0.3
}

function calculatePersonalityMatch(traits1: string[], traits2: string[]): number {
  if (traits1.length === 0 || traits2.length === 0) return 0.5

  let matchCount = 0
  let totalComparisons = 0

  traits1.forEach(trait1 => {
    const compatible = PERSONALITY_COMPATIBILITY[trait1.toLowerCase()] || []
    traits2.forEach(trait2 => {
      totalComparisons++
      if (compatible.includes(trait2.toLowerCase())) {
        matchCount++
      }
    })
  })

  return totalComparisons > 0 ? matchCount / totalComparisons : 0.5
}

function calculateInterestMatch(interests1: string[], interests2: string[]): number {
  if (interests1.length === 0 || interests2.length === 0) return 0.5

  const set1 = new Set(interests1.map(i => i.toLowerCase()))
  const set2 = new Set(interests2.map(i => i.toLowerCase()))
  
  const intersection = [...set1].filter(i => set2.has(i)).length
  const union = new Set([...set1, ...set2]).size

  return union > 0 ? intersection / union : 0
}

function calculateAgeCompatibility(age1: number, age2: number): number {
  const ageDiff = Math.abs(age1 - age2)
  
  if (ageDiff === 0) return 1
  if (ageDiff <= 1) return 0.9
  if (ageDiff <= 2) return 0.8
  if (ageDiff <= 3) return 0.6
  if (ageDiff <= 5) return 0.4
  return 0.2
}

export async function generateMatchReasoning(userPet: Pet, otherPet: Pet): Promise<string[]> {
  const factors = getCompatibilityFactors(userPet, otherPet)
  const compatibility = calculateCompatibility(userPet, otherPet)

  const prompt = buildLLMPrompt`You are a pet compatibility expert. Generate 2-3 short, engaging reasons (max 10 words each) why these two pets would be great companions.

Pet 1: ${String(userPet.name ?? '')}
- Breed: ${String(userPet.breed ?? '')}
- Age: ${String(userPet.age ?? '')} years
- Size: ${String(userPet.size ?? '')}
- Personality: ${String(userPet.personality.join(', ') ?? '')}
- Interests: ${String(userPet.interests.join(', ') ?? '')}
- Looking for: ${String(userPet.lookingFor.join(', ') ?? '')}

Pet 2: ${String(otherPet.name ?? '')}
- Breed: ${String(otherPet.breed ?? '')}
- Age: ${String(otherPet.age ?? '')} years
- Size: ${String(otherPet.size ?? '')}
- Personality: ${String(otherPet.personality.join(', ') ?? '')}
- Interests: ${String(otherPet.interests.join(', ') ?? '')}
- Looking for: ${String(otherPet.lookingFor.join(', ') ?? '')}

Compatibility Score: ${String(compatibility ?? '')}%

Focus on:
- Shared interests and activities they could enjoy together
- Compatible personality traits and energy levels
- Similar goals (playdate, training, cuddles, etc.)
- Age/size compatibility for safe play

Return as JSON with a "reasons" array of 2-3 strings:
{
  "reasons": ["reason 1", "reason 2", "reason 3"]
}`

  try {
  const result = await llmService.llm(prompt, 'gpt-4o-mini', true)
    const data = JSON.parse(result)
    return data.reasons || generateFallbackReasoning(userPet, otherPet, factors)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.warn('AI reasoning unavailable, using fallback logic', { error: err })
    return generateFallbackReasoning(userPet, otherPet, factors)
  }
}

function generateFallbackReasoning(userPet: Pet, otherPet: Pet, factors: CompatibilityFactors): string[] {
  const reasoning: string[] = []

  if (factors.personalityMatch > 0.7) {
    const commonTraits = userPet.personality.filter(t => 
      otherPet.personality.some(ot => {
        const compatible = PERSONALITY_COMPATIBILITY[t.toLowerCase()] || []
        return compatible.includes(ot.toLowerCase())
      })
    )
    if (commonTraits.length > 0 && commonTraits[0]) {
      reasoning.push(`Compatible personalities: both are ${String(commonTraits[0].toLowerCase() ?? '')}`)
    }
  }

  if (factors.interestMatch > 0.5) {
    const commonInterests = userPet.interests.filter(i => 
      otherPet.interests.some(oi => oi.toLowerCase() === i.toLowerCase())
    )
    if (commonInterests.length > 0) {
      reasoning.push(`Share ${String(commonInterests.length ?? '')} common interest${String(commonInterests.length > 1 ? 's' : '' ?? '')}: ${String(commonInterests[0] ?? '')}`)
    }
  }

  if (factors.sizeMatch === 1) {
    reasoning.push('Perfect size match for safe play')
  }

  if (factors.ageCompatibility > 0.8) {
    reasoning.push('Similar age and energy levels')
  }

  if (reasoning.length === 0) {
    reasoning.push('Could be a great match!')
  }

  return reasoning
}

/**
 * Synchronous match reasons generator - returns immediate results without LLM
 * Use this when you need instant match reasons without waiting for AI
 */
export function generateMatchReasonsSync(userPet: Pet, otherPet: Pet): string[] {
  const factors = getCompatibilityFactors(userPet, otherPet)
  return generateFallbackReasoning(userPet, otherPet, factors)
}
