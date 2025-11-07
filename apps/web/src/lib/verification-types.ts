export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired'
export type DocumentType = 'pet_ownership' | 'vaccination_records' | 'microchip_registration' | 'vet_records' | 'adoption_papers' | 'photo_id' | 'address_proof'

export interface VerificationDocument {
  id: string
  type: DocumentType
  fileName: string
  fileSize: number
  uploadedAt: string
  status: VerificationStatus
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  expiresAt?: string
  fileData?: string
}

export interface VerificationRequest {
  id: string
  petId: string
  userId: string
  requestedAt: string
  status: VerificationStatus
  documents: VerificationDocument[]
  verificationLevel: VerificationLevel
  completedAt?: string
  reviewedBy?: string
  reviewNotes?: string
  trustScore?: number
}

export type VerificationLevel = 'basic' | 'standard' | 'premium'

export interface VerificationRequirements {
  level: VerificationLevel
  requiredDocuments: DocumentType[]
  optionalDocuments: DocumentType[]
  estimatedReviewTime: string
  benefits: string[]
}

export interface VerificationStats {
  totalRequests: number
  pendingRequests: number
  verifiedUsers: number
  verificationRate: number
  averageReviewTime: string
}

export const VERIFICATION_REQUIREMENTS: Record<VerificationLevel, VerificationRequirements> = {
  basic: {
    level: 'basic',
    requiredDocuments: ['pet_ownership', 'photo_id'],
    optionalDocuments: ['vaccination_records'],
    estimatedReviewTime: '1-2 business days',
    benefits: [
      'Verified badge on profile',
      'Increased trust from other users',
      'Priority in search results',
      'Access to verified-only matches'
    ]
  },
  standard: {
    level: 'standard',
    requiredDocuments: ['pet_ownership', 'vaccination_records', 'photo_id', 'address_proof'],
    optionalDocuments: ['microchip_registration', 'vet_records'],
    estimatedReviewTime: '2-3 business days',
    benefits: [
      'All Basic benefits',
      'Premium verified badge',
      'Higher match priority',
      'Access to premium events',
      'Enhanced profile visibility',
      'Verification certificate'
    ]
  },
  premium: {
    level: 'premium',
    requiredDocuments: ['pet_ownership', 'vaccination_records', 'microchip_registration', 'vet_records', 'photo_id', 'address_proof'],
    optionalDocuments: ['adoption_papers'],
    estimatedReviewTime: '3-5 business days',
    benefits: [
      'All Standard benefits',
      'Gold verified badge',
      'Top priority in all searches',
      'Exclusive premium community access',
      'Background check certificate',
      'Dedicated support',
      'Annual re-verification included',
      'Trust score guarantee'
    ]
  }
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  pet_ownership: 'Pet Ownership Proof',
  vaccination_records: 'Vaccination Records',
  microchip_registration: 'Microchip Registration',
  vet_records: 'Veterinary Records',
  adoption_papers: 'Adoption Papers',
  photo_id: 'Photo ID',
  address_proof: 'Proof of Address'
}

export const DOCUMENT_TYPE_DESCRIPTIONS: Record<DocumentType, string> = {
  pet_ownership: 'Proof of pet ownership (license, registration, or purchase documents)',
  vaccination_records: 'Up-to-date vaccination records from licensed veterinarian',
  microchip_registration: 'Microchip registration certificate with your information',
  vet_records: 'Recent veterinary visit records or health certificates',
  adoption_papers: 'Official adoption papers from shelter or rescue',
  photo_id: 'Government-issued photo identification',
  address_proof: 'Utility bill, lease, or other address verification'
}
