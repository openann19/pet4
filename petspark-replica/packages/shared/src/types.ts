/**
 * Core type definitions for PETSPARK platform
 * These types are shared across web and mobile applications
 */

// Base entity types
export interface BaseEntity {
  readonly id: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

// User and Pet types
export interface User extends BaseEntity {
  readonly email: string
  readonly username: string
  readonly displayName: string
  readonly avatar?: string
  readonly verified: boolean
  readonly premium: boolean
}

export interface Pet extends BaseEntity {
  readonly name: string
  readonly type: PetType
  readonly breed?: string
  readonly age: number
  readonly gender: PetGender
  readonly weight?: number
  readonly description?: string
  readonly images: readonly string[]
  readonly owner: User
  readonly location?: Location
  readonly tags: readonly string[]
  readonly verified: boolean
}

export enum PetType {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  RABBIT = 'rabbit',
  HAMSTER = 'hamster',
  FISH = 'fish',
  REPTILE = 'reptile',
  OTHER = 'other',
}

export enum PetGender {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown',
}

// Social and interaction types
export interface Post extends BaseEntity {
  readonly author: User
  readonly content: string
  readonly images?: readonly string[]
  readonly pet?: Pet
  readonly likes: readonly string[]
  readonly comments: readonly Comment[]
  readonly tags: readonly string[]
}

export interface Comment extends BaseEntity {
  readonly author: User
  readonly content: string
  readonly likes: readonly string[]
}

// Data transfer objects for create/update operations
export interface CreatePostData {
  readonly content: string
  readonly images?: readonly string[]
  readonly petId?: string
  readonly tags?: readonly string[]
}

export interface UpdatePostData {
  readonly content?: string
  readonly images?: readonly string[]
  readonly tags?: readonly string[]
}

export interface CreatePetData {
  readonly name: string
  readonly type: PetType
  readonly breed?: string
  readonly age: number
  readonly gender: PetGender
  readonly weight?: number
  readonly description?: string
  readonly images?: readonly string[]
  readonly location?: Location
  readonly tags?: readonly string[]
}

export interface UpdatePetData {
  readonly name?: string
  readonly breed?: string
  readonly age?: number
  readonly weight?: number
  readonly description?: string
  readonly images?: readonly string[]
  readonly location?: Location
  readonly tags?: readonly string[]
}

export interface ChatRoom extends BaseEntity {
  readonly id: string
  readonly participants: readonly User[]
  readonly lastMessage?: Message
  readonly unreadCounts: Readonly<Record<string, number>>
}

export interface Message extends BaseEntity {
  readonly id: string
  readonly author: User
  readonly content: string
  readonly type: MessageType
  readonly attachments?: readonly MessageAttachment[]
  // Extended chat features for mobile parity (optional for backward compatibility)
  readonly roomId?: string
  readonly senderId?: string
  readonly senderName?: string
  readonly senderAvatar?: string
  readonly status?: MessageStatus
  readonly timestamp?: string // Alias for compatibility
  readonly reactions?: Record<ReactionType, string[]> | { emoji: ReactionType; userId: string; userName: string }[]
  readonly metadata?: Record<string, unknown>
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  VOICE = 'voice',
  LOCATION = 'location',
  STICKER = 'sticker',
  PET_CARD = 'pet-card',
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export type ReactionType = '❤️' | '😂' | '👍' | '👎' | '🔥' | '🙏' | '⭐'

// Typing indicator types for chat component parity
export interface TypingUser {
  readonly userId: string
  readonly userName: string
  readonly startedAt: string
  readonly userAvatar?: string
}

// Auth types for component parity
export interface UserCredentials {
  readonly email: string
  readonly password: string
}

export interface SignUpCredentials extends UserCredentials {
  readonly displayName: string
  readonly username: string
  readonly confirmPassword: string
}

export interface AuthValidationError {
  readonly field: 'email' | 'password' | 'confirmPassword' | 'displayName' | 'username'
  readonly message: string
}

export interface AuthValidationResult {
  readonly isValid: boolean
  readonly errors: readonly AuthValidationError[]
}

// Adoption types for component parity
export interface AdoptionListing {
  readonly id: string
  readonly ownerId: string
  readonly ownerName: string
  readonly ownerAvatar?: string
  readonly petId: string
  readonly petName: string
  readonly petBreed: string
  readonly petAge: number
  readonly petGender: 'male' | 'female'
  readonly petSize: 'tiny' | 'small' | 'medium' | 'large' | 'extra-large'
  readonly petSpecies: 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'reptile' | 'other'
  readonly petColor?: string
  readonly petPhotos: readonly string[]
  readonly petDescription: string
  readonly status: 'active' | 'pending_review' | 'adopted' | 'withdrawn'
  readonly fee?: { amount: number; currency: string } | null
  readonly location: {
    readonly city: string
    readonly country: string
    readonly lat?: number
    readonly lon?: number
    readonly privacyRadiusM?: number
  }
  readonly requirements: readonly string[]
  readonly vaccinated: boolean
  readonly spayedNeutered: boolean
  readonly microchipped: boolean
  readonly goodWithKids: boolean
  readonly goodWithPets: boolean
  readonly goodWithCats?: boolean
  readonly goodWithDogs?: boolean
  readonly energyLevel: 'low' | 'medium' | 'high' | 'very-high'
  readonly temperament: readonly string[]
  readonly specialNeeds?: string
  readonly reasonForAdoption: string
  readonly createdAt: string
  readonly featured?: boolean
  readonly distance?: number
}

export interface MessageAttachment {
  readonly url: string
  readonly type: 'image' | 'video' | 'file'
  readonly metadata?: Readonly<Record<string, unknown>>
}

// Story types for component parity
export interface Story extends BaseEntity {
  readonly userId: string
  readonly petId: string
  readonly petName: string
  readonly petPhoto: string
  readonly content?: string
  readonly media?: readonly string[]
  readonly views?: readonly StoryView[]
  readonly expiresAt: Date
  readonly isExpired: boolean
}

export interface StoryView {
  readonly userId: string
  readonly viewedAt: Date
}

// Location and discovery types
export interface Location {
  readonly latitude: number
  readonly longitude: number
  readonly address?: string
  readonly city?: string
  readonly country?: string
}

export interface DiscoveryFilters {
  readonly petTypes: readonly PetType[]
  readonly ageRange: [number, number]
  readonly distance: number
  readonly location: Location
  readonly tags: readonly string[]
}

// API and state types
export interface ApiResponse<T> {
  readonly data: T
  readonly success: boolean
  readonly message?: string
  readonly errors?: readonly string[]
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[]
  readonly total: number
  readonly page: number
  readonly pageSize: number
  readonly hasNext: boolean
}

// Component prop types
export interface BaseComponentProps {
  readonly className?: string
  readonly testId?: string
}

export interface ButtonProps extends BaseComponentProps {
  readonly variant: 'primary' | 'secondary' | 'outline' | 'ghost'
  readonly size: 'sm' | 'md' | 'lg'
  readonly disabled?: boolean
  readonly loading?: boolean
  readonly onPress: () => void
  readonly children: React.ReactNode
}

// Theme and UI types
export interface Theme {
  readonly colors: {
    readonly primary: string
    readonly secondary: string
    readonly accent: string
    readonly background: string
    readonly surface: string
    readonly text: string
    readonly textSecondary: string
    readonly border: string
    readonly error: string
    readonly success: string
    readonly warning: string
  }
  readonly spacing: {
    readonly xs: string
    readonly sm: string
    readonly md: string
    readonly lg: string
    readonly xl: string
  }
  readonly borderRadius: {
    readonly sm: string
    readonly md: string
    readonly lg: string
    readonly full: string
  }
}
