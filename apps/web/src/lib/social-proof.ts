import { generateULID } from './utils'
import { isTruthy, isDefined } from '@/core/guards';

export interface TrustBadge {
  id: string
  type: 'verified' | 'health-certified' | 'experienced-owner' | 'responsive' | 'top-rated' | 'community-favorite'
  label: string
  description: string
  earnedDate: number
  icon: string
}

export interface PetReview {
  id: string
  petId: string
  reviewerId: string
  reviewerName: string
  rating: number
  comment: string
  playdateId?: string
  createdAt: number
  helpful: number
  photos?: string[]
}

export interface PetEndorsement {
  id: string
  petId: string
  endorserId: string
  endorserName: string
  endorserPetName: string
  trait: string
  createdAt: number
}

export interface SocialProof {
  totalMatches: number
  totalPlaydates: number
  averageRating: number
  reviewCount: number
  endorsementCount: number
  trustBadges: TrustBadge[]
  recentReviews: PetReview[]
  topEndorsements: PetEndorsement[]
  responseRate: number
  responseTime: string
  lastActive: number
}

export const TRUST_BADGE_CRITERIA = {
  verified: {
    label: 'Verified Pet',
    description: 'Identity and ownership verified',
    icon: '✓',
    requirement: 'Complete profile verification'
  },
  'health-certified': {
    label: 'Health Certified',
    description: 'Up-to-date vaccinations',
    icon: '❤️',
    requirement: 'All vaccinations current'
  },
  'experienced-owner': {
    label: 'Experienced Owner',
    description: '1+ years of pet ownership',
    icon: '⭐',
    requirement: 'Account age 1+ years'
  },
  responsive: {
    label: 'Highly Responsive',
    description: 'Responds within 2 hours',
    icon: '⚡',
    requirement: 'Average response time < 2 hours'
  },
  'top-rated': {
    label: 'Top Rated',
    description: '4.5+ average rating',
    icon: '🏆',
    requirement: 'Rating 4.5+ with 5+ reviews'
  },
  'community-favorite': {
    label: 'Community Favorite',
    description: 'Loved by the community',
    icon: '💎',
    requirement: '20+ endorsements'
  }
}

export function calculateTrustScore(proof: SocialProof): number {
  let score = 0
  
  score += Math.min(proof.trustBadges.length * 10, 30)
  score += Math.min(proof.averageRating * 10, 50)
  score += Math.min(proof.endorsementCount * 2, 20)
  score += proof.responseRate >= 80 ? 10 : 0
  
  return Math.min(score, 100)
}

export function generateReviewSummary(reviews: PetReview[]): {
  rating: number
  distribution: Record<number, number>
  topKeywords: string[]
} {
  if (reviews.length === 0) {
    return { rating: 0, distribution: {}, topKeywords: [] }
  }

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
  const rating = totalRating / reviews.length

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  reviews.forEach(r => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1
  })

  const keywords = reviews
    .map(r => r.comment.toLowerCase())
    .join(' ')
    .split(/\s+/)
    .filter(word => word.length > 4)

  const wordCounts: Record<string, number> = {}
  keywords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })

  const topKeywords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)

  return { rating, distribution, topKeywords }
}

export function checkBadgeEligibility(
  _petId: string,
  metrics: {
    isVerified: boolean
    hasVaccinations: boolean
    accountAge: number
    responseTime: number
    rating: number
    reviewCount: number
    endorsementCount: number
  }
): TrustBadge[] {
  const badges: TrustBadge[] = []
  const now = Date.now()

  if (isTruthy(metrics.isVerified)) {
    badges.push({
      id: generateULID(),
      type: 'verified',
      label: TRUST_BADGE_CRITERIA.verified.label,
      description: TRUST_BADGE_CRITERIA.verified.description,
      icon: TRUST_BADGE_CRITERIA.verified.icon,
      earnedDate: now
    })
  }

  if (isTruthy(metrics.hasVaccinations)) {
    badges.push({
      id: generateULID(),
      type: 'health-certified',
      label: TRUST_BADGE_CRITERIA['health-certified'].label,
      description: TRUST_BADGE_CRITERIA['health-certified'].description,
      icon: TRUST_BADGE_CRITERIA['health-certified'].icon,
      earnedDate: now
    })
  }

  if (metrics.accountAge >= 365) {
    badges.push({
      id: generateULID(),
      type: 'experienced-owner',
      label: TRUST_BADGE_CRITERIA['experienced-owner'].label,
      description: TRUST_BADGE_CRITERIA['experienced-owner'].description,
      icon: TRUST_BADGE_CRITERIA['experienced-owner'].icon,
      earnedDate: now
    })
  }

  if (metrics.responseTime < 2) {
    badges.push({
      id: generateULID(),
      type: 'responsive',
      label: TRUST_BADGE_CRITERIA.responsive.label,
      description: TRUST_BADGE_CRITERIA.responsive.description,
      icon: TRUST_BADGE_CRITERIA.responsive.icon,
      earnedDate: now
    })
  }

  if (metrics.rating >= 4.5 && metrics.reviewCount >= 5) {
    badges.push({
      id: generateULID(),
      type: 'top-rated',
      label: TRUST_BADGE_CRITERIA['top-rated'].label,
      description: TRUST_BADGE_CRITERIA['top-rated'].description,
      icon: TRUST_BADGE_CRITERIA['top-rated'].icon,
      earnedDate: now
    })
  }

  if (metrics.endorsementCount >= 20) {
    badges.push({
      id: generateULID(),
      type: 'community-favorite',
      label: TRUST_BADGE_CRITERIA['community-favorite'].label,
      description: TRUST_BADGE_CRITERIA['community-favorite'].description,
      icon: TRUST_BADGE_CRITERIA['community-favorite'].icon,
      earnedDate: now
    })
  }

  return badges
}
