/**
 * Adoption Domain - Marketplace Types and Rules
 * 
 * Core business logic for adoption listings, applications, and workflows.
 * This is pure domain logic with no infrastructure dependencies.
 */

/**
 * Adoption listing status
 * 
 * Valid state transitions:
 * - pending_review -> active (approved)
 * - pending_review -> withdrawn (owner cancels)
 * - active -> adopted (pet is adopted)
 * - active -> withdrawn (owner cancels)
 */
export type AdoptionListingStatus = 'active' | 'pending_review' | 'adopted' | 'withdrawn'

/**
 * Adoption application status
 * 
 * Valid state transitions:
 * - submitted -> under_review (owner starts review)
 * - under_review -> accepted (owner accepts)
 * - under_review -> rejected (owner rejects)
 */
export type AdoptionApplicationStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected'

/**
 * Check if a listing status transition is valid
 */
export function isValidListingStatusTransition(
  current: AdoptionListingStatus,
  next: AdoptionListingStatus
): boolean {
  // Can't transition to the same status
  if (current === next) {
    return false
  }

  switch (current) {
    case 'pending_review':
      // Can go to active (approved) or withdrawn (cancelled)
      return next === 'active' || next === 'withdrawn'

    case 'active':
      // Can go to adopted (successful) or withdrawn (cancelled)
      return next === 'adopted' || next === 'withdrawn'

    case 'adopted':
      // Final state - no transitions allowed
      return false

    case 'withdrawn':
      // Final state - no transitions allowed
      return false

    default:
      return false
  }
}

/**
 * Check if an application status transition is valid
 */
export function isValidApplicationStatusTransition(
  current: AdoptionApplicationStatus,
  next: AdoptionApplicationStatus
): boolean {
  // Can't transition to the same status
  if (current === next) {
    return false
  }

  switch (current) {
    case 'submitted':
      // Can go to under_review (owner starts review)
      return next === 'under_review'

    case 'under_review':
      // Can go to accepted or rejected
      return next === 'accepted' || next === 'rejected'

    case 'accepted':
      // Final state - no transitions allowed
      return false

    case 'rejected':
      // Final state - no transitions allowed
      return false

    default:
      return false
  }
}

/**
 * Adoption listing location
 */
export interface AdoptionListingLocation {
  city: string
  country: string
  lat?: number
  lon?: number
  privacyRadiusM?: number
}

/**
 * Adoption fee
 */
export interface AdoptionFee {
  amount: number
  currency: string
}

/**
 * Veterinary document
 */
export interface VetDocument {
  id: string
  type: 'vaccination' | 'medical_record' | 'spay_neuter' | 'health_certificate' | 'microchip' | 'other'
  name: string
  url: string
  uploadedAt: string
  verified: boolean
}

/**
 * Check if a listing can be edited by the owner
 */
export function canEditListing(status: AdoptionListingStatus): boolean {
  // Can only edit if pending review or active
  return status === 'pending_review' || status === 'active'
}

/**
 * Check if a listing can receive applications
 */
export function canReceiveApplications(status: AdoptionListingStatus): boolean {
  // Can only receive applications if active
  return status === 'active'
}

/**
 * Check if an application can be reviewed
 */
export function canReviewApplication(status: AdoptionApplicationStatus): boolean {
  // Can only review if submitted or under_review
  return status === 'submitted' || status === 'under_review'
}

