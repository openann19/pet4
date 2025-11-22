/**
 * GDPR Types
 *
 * Defines types for GDPR data export and deletion operations.
 */

export interface UserDataExport {
  user: UserProfileData;
  sessions: SessionData[];
  pets: PetData[];
  matches: MatchData[];
  chats: ChatData[];
  posts: PostData[];
  preferences: UserPreferencesData;
  payments: PaymentData[];
  verification: VerificationData[];
  consents: ConsentData[];
  metadata: ExportMetadata;
}

export interface UserProfileData {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  phoneVerified?: boolean;
  ageVerified: boolean;
  createdAt: string;
  lastSeenAt: string;
  metadata?: Record<string, unknown>;
}

export interface SessionData {
  id: string;
  userId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  expiresAt?: string;
  lastActivityAt?: string;
}

export interface PetData {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  bio?: string;
  photos: string[];
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MatchData {
  id: string;
  petId: string;
  matchedPetId: string;
  ownerId: string;
  status: 'pending' | 'matched' | 'rejected' | 'expired';
  matchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatData {
  id: string;
  matchId: string;
  participants: string[];
  messages: MessageData[];
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageData {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'system';
  mediaUrl?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostData {
  id: string;
  authorId: string;
  content: string;
  mediaUrls: string[];
  visibility: 'public' | 'matches' | 'followers' | 'private';
  status: 'active' | 'archived' | 'deleted';
  reactions: ReactionData[];
  comments: CommentData[];
  createdAt: string;
  updatedAt: string;
}

export interface ReactionData {
  userId: string;
  type: 'like' | 'love' | 'celebrate';
  createdAt: string;
}

export interface CommentData {
  id: string;
  userId: string;
  content: string;
  reactions: ReactionData[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferencesData {
  theme: 'light' | 'dark';
  language: 'en' | 'bg';
  notifications: {
    push: boolean;
    email: boolean;
    matches: boolean;
    messages: boolean;
    likes: boolean;
  };
  quietHours: {
    start: string;
    end: string;
  } | null;
  privacy: {
    profileVisibility: 'public' | 'matches-only' | 'private';
    locationSharing: 'precise' | 'approximate' | 'off';
    onlineStatus: 'visible' | 'hidden';
    readReceipts: boolean;
    activityStatus: boolean;
    allowStorySharing: boolean;
    allowAnalytics: boolean;
  };
}

export interface PaymentData {
  id: string;
  userId: string;
  type: 'subscription' | 'purchase' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  productId?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationData {
  id: string;
  userId: string;
  status: 'pending' | 'verified' | 'rejected';
  level: 'basic' | 'premium' | 'elite';
  verifiedAt?: string;
  documents?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConsentData {
  id: string;
  userId: string;
  category: 'essential' | 'analytics' | 'marketing' | 'third_party';
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  version: string;
  acceptedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ExportMetadata {
  exportDate: string;
  exportVersion: string;
  userId: string;
  format: 'json';
}

export interface DataDeletionResult {
  success: boolean;
  deletedCollections: string[];
  deletedRecords: number;
  errors: DeletionError[];
  scheduledDeletion?: boolean;
  deletionDate?: string;
}

export interface DeletionError {
  collection: string;
  recordId: string;
  error: string;
}

export interface DataExportRequest {
  userId: string;
  format?: 'json';
}

export interface DataDeletionRequest {
  userId: string;
  confirmDeletion: boolean;
  reason?: string;
}

export interface ConsentUpdateRequest {
  userId: string;
  category: 'essential' | 'analytics' | 'marketing' | 'third_party';
  status: 'accepted' | 'rejected' | 'withdrawn';
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

