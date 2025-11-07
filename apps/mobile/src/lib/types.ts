export interface TrustBadge {
  id: string
  type: 'verified_owner' | 'vaccinated' | 'health_certified' | 'background_check' | 'experienced_owner' | 'trainer_approved' | 'rescue_supporter' | 'community_favorite' | 'active_member' | 'top_rated'
  label: string
  description: string
  earnedAt: string
  icon?: string
}

export interface Rating {
  id: string
  petId: string
  reviewerId: string
  reviewerName: string
  reviewerAvatar?: string
  rating: number
  comment: string
  helpful: number
  category: 'playdate' | 'behavior' | 'temperament' | 'owner_communication' | 'general'
  createdAt: string
}

export interface PetTrustProfile {
  overallRating: number
  totalReviews: number
  ratingBreakdown: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  badges: TrustBadge[]
  playdateCount: number
  responseRate: number
  responseTime: string
  trustScore: number
}

export interface Pet {
  id: string
  name: string
  breed: string
  age: number
  gender: 'male' | 'female'
  size: 'small' | 'medium' | 'large' | 'extra-large'
  photo: string
  photos: string[]
  bio: string
  personality: string[]
  interests: string[]
  lookingFor: string[]
  location: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  distance?: number
  ownerId: string
  ownerName: string
  ownerAvatar?: string
  verified: boolean
  createdAt: string
  trustProfile?: PetTrustProfile
  ratings?: Rating[]
  trustScore?: number
  badges?: TrustBadge[]
  activityLevel?: 'low' | 'moderate' | 'high' | 'very-high'
  playdateCount?: number
  overallRating?: number
  responseRate?: number
}

export interface Match {
  id: string
  petId: string
  matchedPetId: string
  matchedPetName?: string
  matchedPetPhoto?: string
  compatibilityScore: number
  reasoning: string[]
  matchedAt: string
  status: 'active' | 'archived'
}

export interface SwipeAction {
  petId: string
  targetPetId: string
  action: 'like' | 'pass' | 'superlike'
  timestamp: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  location: string
  pets: string[]
  createdAt: string
}

export interface CompatibilityFactors {
  sizeMatch: number
  personalityMatch: number
  interestMatch: number
  ageCompatibility: number
  locationProximity: number
}

// Adoption types
export interface AdoptionApplication {
  _id: string
  id?: string
  adoptionProfileId: string
  petId?: string
  applicantId: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  householdType: 'house' | 'apartment' | 'condo' | 'other'
  hasYard: boolean
  hasOtherPets: boolean
  otherPetsDetails?: string
  hasChildren: boolean
  childrenAges?: string
  experience: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'submitted' | 'under_review' | 'accepted'
  submittedAt: string
  reviewedAt?: string
  reviewNotes?: string
}

export interface AdoptionProcess {
  applicationId: string
  status: string
  steps: Array<{
    name: string
    status: 'pending' | 'completed' | 'in_progress'
    completedAt?: string
  }>
  nextStep?: string
  meetingScheduled?: {
    dateTime: string
    location: string
    meetingId: string
  }
}

// Community types
export type PostKind = 'text' | 'photo' | 'video' | 'event'
export type PostVisibility = 'public' | 'matches' | 'followers' | 'private'
export type PostStatus = 'active' | 'pending_review' | 'rejected' | 'archived'

export interface CommunityPost {
  id: string
  _id?: string
  authorId: string
  authorName: string
  authorAvatar?: string
  kind: PostKind
  title?: string
  text?: string
  content?: string
  media?: string[]
  petIds?: string[]
  tags?: string[]
  category?: string
  location?: {
    city?: string
    country?: string
    lat?: number
    lon?: number
    lng?: number
  }
  visibility: PostVisibility
  status: PostStatus
  createdAt: string
  updatedAt: string
  viewsCount?: number
  reactionsCount?: number
  likesCount?: number
  commentsCount?: number
  sharesCount?: number
  liked?: boolean
}

export interface CommunityComment {
  id: string
  _id?: string
  postId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  text: string
  content?: string
  status: 'active' | 'deleted' | 'hidden'
  createdAt: string
  updatedAt: string
  reactionsCount?: number
}

// Chat types
export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'location' | 'sticker' | 'pet-card'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface MessageAttachment {
  id: string
  type: 'image' | 'video' | 'file'
  url: string
  thumbnail?: string
  name?: string
  size?: number
  mimeType?: string
}

export interface Message {
  id: string
  roomId: string
  chatRoomId?: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  type: MessageType
  content: string
  status: MessageStatus
  timestamp?: string
  createdAt?: string
  attachments?: MessageAttachment[]
  metadata?: {
    messageId?: string
    translation?: {
      originalLang: string
      translatedText: string
      targetLang: string
    }
    media?: {
      url: string
      thumbnail?: string
      width?: number
      height?: number
      duration?: number
    }
  }
  reactions?: Array<{
    emoji: string
    userId: string
    userName?: string
  }>
  replyTo?: {
    messageId: string
    content: string
    senderName?: string
  }
}
