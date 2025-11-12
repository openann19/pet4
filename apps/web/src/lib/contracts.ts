export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'suspended' | 'banned';
  lastSeenAt: string;
  preferences: UserPreferences;
  // Password hash stored separately for security
  passwordHash?: string;
  passwordSalt?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'bg';
  notifications: NotificationSettings;
  quietHours: { start: string; end: string } | null;
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  matches: boolean;
  messages: boolean;
  likes: boolean;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  age: number;
  size: 'small' | 'medium' | 'large';
  gender: 'male' | 'female';
  photos: Photo[];
  personality: string[];
  bio: string;
  location: Location;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'hidden' | 'banned';
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  order: number;
  uploadedAt: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

export interface Match {
  id: string;
  petAId: string;
  petBId: string;
  compatibilityScore: number;
  compatibilityBreakdown: CompatibilityBreakdown;
  status: 'active' | 'archived';
  chatRoomId: string;
  createdAt: string;
  lastInteractionAt: string;
}

export interface CompatibilityBreakdown {
  personality: number;
  interests: number;
  size: number;
  age: number;
  location: number;
  overall: number;
}

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  type: 'text' | 'sticker';
  reactions: Reaction[];
  status: 'sending' | 'sent' | 'delivered' | 'read';
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface Reaction {
  userId: string;
  emoji: string;
  addedAt: string;
}

export interface Story {
  id: string;
  petId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  duration: number;
  views: StoryView[];
  expiresAt: string;
  createdAt: string;
  status: 'active' | 'expired' | 'removed';
}

export interface StoryView {
  userId: string;
  viewedAt: string;
}

export type ReportReason = 'spam' | 'inappropriate' | 'fake' | 'harassment' | 'other';

export interface Report {
  id: string;
  reporterId: string;
  reportedEntityType: 'user' | 'pet' | 'message';
  reportedEntityId: string;
  reason: ReportReason;
  details: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  assignedTo?: string;
  resolution?: ReportResolution;
  createdAt: string;
  resolvedAt?: string;
}

export interface ReportResolution {
  action: 'warn' | 'suspend' | 'ban' | 'remove_content' | 'no_action';
  notes: string;
  resolvedBy: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewedPetId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'hidden';
}

export interface Verification {
  id: string;
  petId: string;
  type: 'photo' | 'document';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export type NotificationType =
  | 'match_created'
  | 'new_message'
  | 'like_received'
  | 'story_viewed'
  | 'verification_approved'
  | 'verification_rejected'
  | 'content_removed'
  | 'account_warning';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Permission {
  action: string;
  resource: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    { action: 'create', resource: 'pet' },
    { action: 'read', resource: 'pet' },
    { action: 'update', resource: 'ownPet' },
    { action: 'delete', resource: 'ownPet' },
    { action: 'create', resource: 'match' },
    { action: 'read', resource: 'match' },
    { action: 'create', resource: 'message' },
  ],
  moderator: [
    { action: 'create', resource: 'pet' },
    { action: 'read', resource: 'pet' },
    { action: 'update', resource: 'ownPet' },
    { action: 'delete', resource: 'ownPet' },
    { action: 'create', resource: 'match' },
    { action: 'read', resource: 'match' },
    { action: 'create', resource: 'message' },
    { action: 'read', resource: 'report' },
    { action: 'update', resource: 'report' },
    { action: 'ban', resource: 'pet' },
    { action: 'ban', resource: 'user' },
  ],
  admin: [
    { action: 'create', resource: 'pet' },
    { action: 'read', resource: 'pet' },
    { action: 'update', resource: 'ownPet' },
    { action: 'delete', resource: 'ownPet' },
    { action: 'create', resource: 'match' },
    { action: 'read', resource: 'match' },
    { action: 'create', resource: 'message' },
    { action: 'read', resource: 'report' },
    { action: 'update', resource: 'report' },
    { action: 'ban', resource: 'pet' },
    { action: 'ban', resource: 'user' },
    { action: 'read', resource: 'analytics' },
    { action: 'update', resource: 'featureFlags' },
    { action: 'read', resource: 'auditLog' },
    { action: 'impersonate', resource: 'user' },
  ],
};

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
  correlationId: string;
  timestamp: string;
}

export const ERROR_CODES = {
  AUTH_001: 'Invalid credentials',
  AUTH_002: 'Account locked',
  AUTH_003: 'Token expired',
  AUTH_004: 'Token invalid',
  AUTH_005: 'Refresh failed',
  AUTH_006: 'Session revoked',
  AUTH_007: 'Insufficient permissions',
  MATCH_001: 'Already matched',
  MEDIA_001: 'Upload failed',
  MEDIA_002: 'Invalid file type',
  MEDIA_003: 'File too large',
  RATE_LIMIT_EXCEEDED: 'Too many requests',
} as const;
