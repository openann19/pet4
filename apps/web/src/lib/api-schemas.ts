import { z } from 'zod'

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().min(1),
  country: z.string().min(1),
  roundedLat: z.number().optional(),
  roundedLng: z.number().optional()
})

export const photoSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
  order: z.number().int().min(0),
  uploadedAt: z.string().datetime()
})

export const petSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string().min(1).max(50),
  species: z.enum(['dog', 'cat']),
  breed: z.string().min(1).max(100),
  age: z.number().int().min(0).max(30),
  size: z.enum(['small', 'medium', 'large', 'extra-large']),
  gender: z.enum(['male', 'female']),
  photos: z.array(photoSchema).min(1),
  personality: z.array(z.string()).max(10),
  bio: z.string().max(1000),
  location: locationSchema,
  verified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: z.enum(['active', 'hidden', 'banned']),
  isActive: z.boolean().optional()
})

export const compatibilityBreakdownSchema = z.object({
  personality: z.number().min(0).max(100),
  interests: z.number().min(0).max(100),
  size: z.number().min(0).max(100),
  age: z.number().min(0).max(100),
  location: z.number().min(0).max(100),
  overall: z.number().min(0).max(100)
})

export const matchSchema = z.object({
  id: z.string(),
  petAId: z.string(),
  petBId: z.string(),
  compatibilityScore: z.number().min(0).max(100),
  compatibilityBreakdown: compatibilityBreakdownSchema.optional(),
  status: z.enum(['active', 'archived']),
  chatRoomId: z.string(),
  createdAt: z.string().datetime(),
  lastInteractionAt: z.string().datetime()
})

export const reactionSchema = z.object({
  userId: z.string(),
  emoji: z.string(),
  addedAt: z.string().datetime()
})

export const messageSchema = z.object({
  id: z.string(),
  chatRoomId: z.string(),
  senderId: z.string(),
  content: z.string().max(5000),
  type: z.enum(['text', 'sticker']),
  reactions: z.array(reactionSchema),
  status: z.enum(['sending', 'sent', 'delivered', 'read']),
  createdAt: z.string().datetime(),
  deliveredAt: z.string().datetime().optional(),
  readAt: z.string().datetime().optional()
})

export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
  language: z.enum(['en', 'bg']),
  notifications: z.object({
    push: z.boolean(),
    email: z.boolean(),
    matches: z.boolean(),
    messages: z.boolean(),
    likes: z.boolean()
  }),
  quietHours: z.object({
    start: z.string(),
    end: z.string()
  }).nullable()
})

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
  roles: z.array(z.enum(['user', 'moderator', 'admin'])),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: z.enum(['active', 'suspended', 'banned']),
  lastSeenAt: z.string().datetime(),
  preferences: userPreferencesSchema
})

export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive()
})

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum([
    'match_created',
    'new_message',
    'like_received',
    'story_viewed',
    'verification_approved',
    'verification_rejected',
    'content_removed',
    'account_warning'
  ]),
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()),
  read: z.boolean(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional()
})

export const reportResolutionSchema = z.object({
  action: z.enum(['warn', 'suspend', 'ban', 'remove_content', 'no_action']),
  notes: z.string(),
  resolvedBy: z.string()
})

export const reportSchema = z.object({
  id: z.string(),
  reporterId: z.string(),
  reportedEntityType: z.enum(['user', 'pet', 'message']),
  reportedEntityId: z.string(),
  reason: z.enum(['spam', 'inappropriate', 'fake', 'harassment', 'other']),
  details: z.string(),
  status: z.enum(['pending', 'investigating', 'resolved', 'dismissed']),
  assignedTo: z.string().optional(),
  resolution: reportResolutionSchema.optional(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional()
})

export const storyViewSchema = z.object({
  userId: z.string(),
  viewedAt: z.string().datetime()
})

export const storySchema = z.object({
  id: z.string(),
  petId: z.string(),
  mediaUrl: z.string().url(),
  mediaType: z.enum(['image', 'video']),
  duration: z.number().int().positive(),
  views: z.array(storyViewSchema),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  status: z.enum(['active', 'expired', 'removed'])
})

export const verificationSchema = z.object({
  id: z.string(),
  petId: z.string(),
  type: z.enum(['photo', 'document']),
  status: z.enum(['pending', 'approved', 'rejected']),
  submittedAt: z.string().datetime(),
  reviewedAt: z.string().datetime().optional(),
  reviewedBy: z.string().optional(),
  notes: z.string().optional()
})

export const adoptionProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  species: z.enum(['dog', 'cat', 'other']),
  breed: z.string(),
  age: z.number().int().min(0),
  size: z.enum(['small', 'medium', 'large', 'extra-large']),
  gender: z.enum(['male', 'female']),
  photos: z.array(z.string().url()),
  description: z.string(),
  specialNeeds: z.string().optional(),
  goodWithKids: z.boolean(),
  goodWithPets: z.boolean(),
  status: z.enum(['available', 'pending', 'adopted']),
  location: z.string(),
  shelterId: z.string(),
  shelterName: z.string(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const communityPostSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorAvatar: z.string().url().optional(),
  content: z.string().max(5000),
  mediaUrls: z.array(z.string().url()),
  tags: z.array(z.string()).max(10),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string()
  }).optional(),
  reactions: z.record(z.number()),
  commentCount: z.number().int().min(0),
  shareCount: z.number().int().min(0),
  viewCount: z.number().int().min(0),
  status: z.enum(['active', 'hidden', 'removed']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const commentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorAvatar: z.string().url().optional(),
  content: z.string().max(2000),
  parentId: z.string().optional(),
  reactions: z.record(z.number()),
  status: z.enum(['active', 'hidden', 'removed']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  correlationId: z.string(),
  timestamp: z.string().datetime(),
  field: z.string().optional(),
  validationErrors: z.array(z.object({
    field: z.string(),
    message: z.string()
  })).optional()
})

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => 
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    hasMore: z.boolean(),
    nextCursor: z.string().optional()
  })

export const discoverResponseSchema = z.object({
  candidates: z.array(z.object({
    pet: petSchema,
    score: z.number().min(0).max(100),
    distance: z.number().min(0)
  })),
  nextCursor: z.string().optional(),
  totalCount: z.number().int().min(0)
})

export const swipeResponseSchema = z.object({
  recorded: z.boolean(),
  isMatch: z.boolean(),
  matchId: z.string().optional(),
  chatRoomId: z.string().optional()
})

export const photoRecordSchema = z.object({
  id: z.string(),
  petId: z.string(),
  ownerId: z.string(),
  status: z.enum(['pending_upload', 'processing', 'awaiting_review', 'approved', 'rejected', 'held_for_kyc']),
  originalUrl: z.string().url(),
  processedUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  variants: z.array(z.object({
    size: z.enum(['small', 'medium', 'large', 'original']),
    url: z.string().url(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fileSize: z.number().int().positive()
  })),
  metadata: z.object({
    fileHash: z.string(),
    contentFingerprint: z.string(),
    originalFilename: z.string(),
    mimeType: z.string(),
    fileSize: z.number().int().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    exifStripped: z.boolean(),
    uploadIP: z.string().optional()
  }),
  safetyCheck: z.object({
    isNSFW: z.boolean(),
    isViolent: z.boolean(),
    hasHumanFaces: z.boolean(),
    humanFaceCount: z.number().int().min(0),
    humanFaceDominance: z.number().min(0).max(1),
    isDuplicate: z.boolean(),
    duplicateOf: z.string().optional(),
    confidence: z.object({
      nsfw: z.number().min(0).max(1),
      violence: z.number().min(0).max(1),
      animal: z.number().min(0).max(1),
      humanFace: z.number().min(0).max(1)
    }),
    breedInference: z.object({
      breed: z.string(),
      confidence: z.number().min(0).max(1)
    }).optional(),
    flags: z.array(z.string()),
    scannedAt: z.string().datetime()
  }),
  uploadedAt: z.string().datetime(),
  processedAt: z.string().datetime().optional(),
  reviewedAt: z.string().datetime().optional(),
  approvedAt: z.string().datetime().optional(),
  rejectedAt: z.string().datetime().optional()
})

export const kycSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.enum(['unverified', 'pending', 'verified', 'rejected', 'expired']),
  provider: z.enum(['manual', 'stripe_identity', 'onfido', 'persona']),
  providerSessionId: z.string().optional(),
  providerDecisionId: z.string().optional(),
  documents: z.array(z.object({
    id: z.string(),
    type: z.enum(['id_card', 'passport', 'drivers_license', 'selfie']),
    url: z.string().url(),
    uploadedAt: z.string().datetime(),
    verified: z.boolean(),
    extractedData: z.record(z.unknown()).optional()
  })),
  livenessCheck: z.object({
    passed: z.boolean(),
    confidence: z.number().min(0).max(1),
    attemptCount: z.number().int().min(0),
    completedAt: z.string().datetime().optional()
  }).optional(),
  verificationData: z.object({
    fullName: z.string().optional(),
    dateOfBirth: z.string().optional(),
    documentNumber: z.string().optional(),
    documentExpiry: z.string().optional(),
    nationality: z.string().optional(),
    verifiedFields: z.array(z.string())
  }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  submittedAt: z.string().datetime().optional(),
  verifiedAt: z.string().datetime().optional(),
  rejectedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  rejectReason: z.enum(['blurry_document', 'expired_document', 'document_mismatch', 'liveness_failed', 'unreadable', 'incomplete', 'suspicious']).optional(),
  rejectReasonText: z.string().optional(),
  retryCount: z.number().int().min(0)
})

export type Location = z.infer<typeof locationSchema>
export type Photo = z.infer<typeof photoSchema>
export type Pet = z.infer<typeof petSchema>
export type CompatibilityBreakdown = z.infer<typeof compatibilityBreakdownSchema>
export type Match = z.infer<typeof matchSchema>
export type Reaction = z.infer<typeof reactionSchema>
export type Message = z.infer<typeof messageSchema>
export type UserPreferences = z.infer<typeof userPreferencesSchema>
export type User = z.infer<typeof userSchema>
export type AuthTokens = z.infer<typeof authTokensSchema>
export type Notification = z.infer<typeof notificationSchema>
export type Report = z.infer<typeof reportSchema>
export type Story = z.infer<typeof storySchema>
export type Verification = z.infer<typeof verificationSchema>
export type AdoptionProfile = z.infer<typeof adoptionProfileSchema>
export type CommunityPost = z.infer<typeof communityPostSchema>
export type Comment = z.infer<typeof commentSchema>
export type APIError = z.infer<typeof apiErrorSchema>
export type DiscoverResponse = z.infer<typeof discoverResponseSchema>
export type SwipeResponse = z.infer<typeof swipeResponseSchema>
export type PhotoRecord = z.infer<typeof photoRecordSchema>
export type KYCSession = z.infer<typeof kycSessionSchema>
