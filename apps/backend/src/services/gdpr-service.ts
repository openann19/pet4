/**
 * GDPR Service
 *
 * Service layer for GDPR operations: data export, deletion, and consent management.
 * This is a database-agnostic service that can be connected to any data store.
 */

import type {
  UserDataExport,
  DataDeletionResult,
  DataExportRequest,
  DataDeletionRequest,
  ConsentUpdateRequest,
} from '../../../../packages/shared/src/gdpr/gdpr-types';
import type { ConsentRecord } from '../../../../packages/shared/src/gdpr/consent-types';
import { createLogger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';

const logger = createLogger('GDPRService');

// Internal database types (simplified)
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  phoneVerified?: boolean;
  ageVerified: boolean;
  createdAt: Date;
  lastSeenAt: Date;
  metadata?: Record<string, unknown>;
}

export interface Session {
  id: string;
  userId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt?: Date;
  lastActivityAt?: Date;
}

export interface Pet {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  petId: string;
  matchedPetId: string;
  ownerId: string;
  status: 'pending' | 'matched' | 'rejected' | 'expired';
  matchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  matchId: string;
  participants: string[];
  messages: Message[];
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'system';
  mediaUrl?: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  mediaUrls: string[];
  visibility: 'public' | 'matches' | 'followers' | 'private';
  status: 'active' | 'archived' | 'deleted';
  reactions: Reaction[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Reaction {
  userId: string;
  type: 'like' | 'love' | 'celebrate';
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  reactions: Reaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  userId: string;
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

export interface Payment {
  id: string;
  userId: string;
  type: 'subscription' | 'purchase' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  productId?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Verification {
  id: string;
  userId: string;
  status: 'pending' | 'verified' | 'rejected';
  level: 'basic' | 'premium' | 'elite';
  verifiedAt?: Date;
  documents?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Consent {
  id: string;
  userId: string;
  category: 'essential' | 'analytics' | 'marketing' | 'third_party';
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  version: string;
  acceptedAt?: Date;
  rejectedAt?: Date;
  withdrawnAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Database abstraction interface
 * Implement this interface to connect to your actual database
 */
export interface GDPRDatabase {
  getUserById(userId: string): Promise<UserProfile | null>;
  getUserSessions(userId: string): Promise<Session[]>;
  getUserPets(userId: string): Promise<Pet[]>;
  getUserMatches(userId: string): Promise<Match[]>;
  getUserChats(userId: string): Promise<Chat[]>;
  getUserPosts(userId: string): Promise<Post[]>;
  getUserPreferences(userId: string): Promise<UserPreferences | null>;
  getUserPayments(userId: string): Promise<Payment[]>;
  getUserVerifications(userId: string): Promise<Verification[]>;
  getUserConsents(userId: string): Promise<Consent[]>;
  deleteUserData(userId: string): Promise<{ collections: string[]; records: number }>;
  getConsentByCategory(userId: string, category: string): Promise<Consent | null>;
  createOrUpdateConsent(consent: Consent): Promise<Consent>;
}

export class GDPRService {
  constructor(private db: GDPRDatabase) {}

  /**
   * Export user data (GDPR Right to Access)
   */
  async exportUserData(request: DataExportRequest): Promise<UserDataExport> {
    logger.info('Exporting user data', { userId: request.userId });

    const user = await this.db.getUserById(request.userId);
    if (!user) {
      throw new NotFoundError('User', request.userId);
    }

    // Fetch all user data in parallel
    const [
      sessions,
      pets,
      matches,
      chats,
      posts,
      preferences,
      payments,
      verifications,
      consents,
    ] = await Promise.all([
      this.db.getUserSessions(request.userId),
      this.db.getUserPets(request.userId),
      this.db.getUserMatches(request.userId),
      this.db.getUserChats(request.userId),
      this.db.getUserPosts(request.userId),
      this.db.getUserPreferences(request.userId),
      this.db.getUserPayments(request.userId),
      this.db.getUserVerifications(request.userId),
      this.db.getUserConsents(request.userId),
    ]);

    // Transform database entities to export format
    const exportData: UserDataExport = {
      user: this.transformUserProfile(user),
      sessions: sessions.map(this.transformSession),
      pets: pets.map(this.transformPet),
      matches: matches.map(this.transformMatch),
      chats: chats.map(this.transformChat),
      posts: posts.map(this.transformPost),
      preferences: preferences
        ? this.transformPreferences(preferences)
        : this.getDefaultPreferences(),
      payments: payments.map(this.transformPayment),
      verification: verifications.map(this.transformVerification),
      consents: consents.map(this.transformConsent),
      metadata: {
        exportDate: new Date().toISOString(),
        exportVersion: '1.0.0',
        userId: request.userId,
        format: request.format ?? 'json',
      },
    };

    logger.info('User data exported successfully', {
      userId: request.userId,
      recordsCount: {
        sessions: sessions.length,
        pets: pets.length,
        matches: matches.length,
        chats: chats.length,
        posts: posts.length,
        payments: payments.length,
        verifications: verifications.length,
        consents: consents.length,
      },
    });

    return exportData;
  }

  /**
   * Delete user data (GDPR Right to Erasure)
   */
  async deleteUserData(request: DataDeletionRequest): Promise<DataDeletionResult> {
    logger.info('Deleting user data', { userId: request.userId });

    if (!request.confirmDeletion) {
      throw new ValidationError('Deletion must be confirmed', {
        confirmDeletion: request.confirmDeletion,
      });
    }

    const user = await this.db.getUserById(request.userId);
    if (!user) {
      throw new NotFoundError('User', request.userId);
    }

    try {
      const result = await this.db.deleteUserData(request.userId);

      logger.info('User data deleted successfully', {
        userId: request.userId,
        deletedCollections: result.collections,
        deletedRecords: result.records,
      });

      return {
        success: true,
        deletedCollections: result.collections,
        deletedRecords: result.records,
        errors: [],
        deletionDate: new Date().toISOString(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete user data', err, { userId: request.userId });

      return {
        success: false,
        deletedCollections: [],
        deletedRecords: 0,
        errors: [
          {
            collection: 'user',
            recordId: request.userId,
            error: err.message,
          },
        ],
      };
    }
  }

  /**
   * Get user consent status
   */
  async getConsentStatus(userId: string): Promise<ConsentRecord[]> {
    logger.info('Getting consent status', { userId });

    const consents = await this.db.getUserConsents(userId);

    return consents.map(this.transformConsent);
  }

  /**
   * Update user consent
   */
  async updateConsent(request: ConsentUpdateRequest): Promise<ConsentRecord> {
    logger.info('Updating consent', {
      userId: request.userId,
      category: request.category,
      status: request.status,
    });

    const existingConsent = await this.db.getConsentByCategory(
      request.userId,
      request.category
    );

    const now = new Date();
    const consent: Consent = existingConsent
      ? {
          ...existingConsent,
          status: request.status,
          version: request.version,
          acceptedAt:
            request.status === 'accepted'
              ? now
              : existingConsent.acceptedAt !== undefined
                ? existingConsent.acceptedAt
                : undefined,
          rejectedAt:
            request.status === 'rejected'
              ? now
              : existingConsent.rejectedAt !== undefined
                ? existingConsent.rejectedAt
                : undefined,
          withdrawnAt:
            request.status === 'withdrawn'
              ? now
              : existingConsent.withdrawnAt !== undefined
                ? existingConsent.withdrawnAt
                : undefined,
          ipAddress: request.ipAddress ?? existingConsent.ipAddress,
          userAgent: request.userAgent ?? existingConsent.userAgent,
        }
      : {
          id: `consent_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          userId: request.userId,
          category: request.category,
          status: request.status,
          version: request.version,
          acceptedAt: request.status === 'accepted' ? now : undefined,
          rejectedAt: request.status === 'rejected' ? now : undefined,
          withdrawnAt: request.status === 'withdrawn' ? now : undefined,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
        };

    const savedConsent = await this.db.createOrUpdateConsent(consent);

    logger.info('Consent updated successfully', {
      userId: request.userId,
      category: request.category,
      status: request.status,
      consentId: savedConsent.id,
    });

    return this.transformConsent(savedConsent);
  }

  // Transformation methods
  private transformUserProfile(user: UserProfile) {
    const result: UserDataExport['user'] = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      ageVerified: user.ageVerified,
      createdAt: user.createdAt.toISOString(),
      lastSeenAt: user.lastSeenAt.toISOString(),
    };

    if (user.avatarUrl !== undefined) {
      result.avatarUrl = user.avatarUrl;
    }
    if (user.phone !== undefined) {
      result.phone = user.phone;
    }
    if (user.phoneVerified !== undefined) {
      result.phoneVerified = user.phoneVerified;
    }
    if (user.metadata !== undefined) {
      result.metadata = user.metadata;
    }

    return result;
  }

  private transformSession(session: Session) {
    const result: UserDataExport['sessions'][number] = {
      id: session.id,
      userId: session.userId,
      createdAt: session.createdAt.toISOString(),
    };

    if (session.deviceId !== undefined) {
      result.deviceId = session.deviceId;
    }
    if (session.ipAddress !== undefined) {
      result.ipAddress = session.ipAddress;
    }
    if (session.userAgent !== undefined) {
      result.userAgent = session.userAgent;
    }
    if (session.expiresAt !== undefined) {
      result.expiresAt = session.expiresAt.toISOString();
    }
    if (session.lastActivityAt !== undefined) {
      result.lastActivityAt = session.lastActivityAt.toISOString();
    }

    return result;
  }

  private transformPet(pet: Pet) {
    const result: UserDataExport['pets'][number] = {
      id: pet.id,
      ownerId: pet.ownerId,
      name: pet.name,
      species: pet.species,
      photos: pet.photos,
      createdAt: pet.createdAt.toISOString(),
      updatedAt: pet.updatedAt.toISOString(),
    };

    if (pet.breed !== undefined) {
      result.breed = pet.breed;
    }
    if (pet.age !== undefined) {
      result.age = pet.age;
    }
    if (pet.bio !== undefined) {
      result.bio = pet.bio;
    }
    if (pet.location !== undefined) {
      result.location = pet.location;
    }

    return result;
  }

  private transformMatch(match: Match) {
    const result: UserDataExport['matches'][number] = {
      id: match.id,
      petId: match.petId,
      matchedPetId: match.matchedPetId,
      ownerId: match.ownerId,
      status: match.status,
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString(),
    };

    if (match.matchedAt !== undefined) {
      result.matchedAt = match.matchedAt.toISOString();
    }

    return result;
  }

  private transformChat(chat: Chat) {
    const result: UserDataExport['chats'][number] = {
      id: chat.id,
      matchId: chat.matchId,
      participants: chat.participants,
      messages: chat.messages.map((msg) => {
        const messageResult: UserDataExport['chats'][number]['messages'][number] = {
          id: msg.id,
          senderId: msg.senderId,
          content: msg.content,
          type: msg.type,
          createdAt: msg.createdAt.toISOString(),
          updatedAt: msg.updatedAt.toISOString(),
        };

        if (msg.mediaUrl !== undefined) {
          messageResult.mediaUrl = msg.mediaUrl;
        }
        if (msg.readAt !== undefined) {
          messageResult.readAt = msg.readAt.toISOString();
        }

        return messageResult;
      }),
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    };

    if (chat.lastMessageAt !== undefined) {
      result.lastMessageAt = chat.lastMessageAt.toISOString();
    }

    return result;
  }

  private transformPost(post: Post) {
    return {
      id: post.id,
      authorId: post.authorId,
      content: post.content,
      mediaUrls: post.mediaUrls,
      visibility: post.visibility,
      status: post.status,
      reactions: post.reactions.map((r) => ({
        userId: r.userId,
        type: r.type,
        createdAt: r.createdAt.toISOString(),
      })),
      comments: post.comments.map((c) => ({
        id: c.id,
        userId: c.userId,
        content: c.content,
        reactions: c.reactions.map((r) => ({
          userId: r.userId,
          type: r.type,
          createdAt: r.createdAt.toISOString(),
        })),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  private transformPreferences(prefs: UserPreferences) {
    return {
      theme: prefs.theme,
      language: prefs.language,
      notifications: prefs.notifications,
      quietHours: prefs.quietHours,
      privacy: prefs.privacy,
    };
  }

  private getDefaultPreferences() {
    return {
      theme: 'light' as const,
      language: 'en' as const,
      notifications: {
        push: true,
        email: true,
        matches: true,
        messages: true,
        likes: true,
      },
      quietHours: null,
      privacy: {
        profileVisibility: 'public' as const,
        locationSharing: 'approximate' as const,
        onlineStatus: 'visible' as const,
        readReceipts: true,
        activityStatus: true,
        allowStorySharing: true,
        allowAnalytics: false,
      },
    };
  }

  private transformPayment(payment: Payment) {
    const result: UserDataExport['payments'][number] = {
      id: payment.id,
      userId: payment.userId,
      type: payment.type,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };

    if (payment.productId !== undefined) {
      result.productId = payment.productId;
    }
    if (payment.transactionId !== undefined) {
      result.transactionId = payment.transactionId;
    }

    return result;
  }

  private transformVerification(verification: Verification) {
    const result: UserDataExport['verification'][number] = {
      id: verification.id,
      userId: verification.userId,
      status: verification.status,
      level: verification.level,
      createdAt: verification.createdAt.toISOString(),
      updatedAt: verification.updatedAt.toISOString(),
    };

    if (verification.verifiedAt !== undefined) {
      result.verifiedAt = verification.verifiedAt.toISOString();
    }
    if (verification.documents !== undefined) {
      result.documents = verification.documents;
    }

    return result;
  }

  private transformConsent(consent: Consent): ConsentRecord {
    const result: ConsentRecord = {
      id: consent.id,
      userId: consent.userId,
      category: consent.category,
      status: consent.status,
      version: consent.version,
    };

    if (consent.acceptedAt !== undefined) {
      result.acceptedAt = consent.acceptedAt.toISOString();
    }
    if (consent.rejectedAt !== undefined) {
      result.rejectedAt = consent.rejectedAt.toISOString();
    }
    if (consent.withdrawnAt !== undefined) {
      result.withdrawnAt = consent.withdrawnAt.toISOString();
    }
    if (consent.ipAddress !== undefined) {
      result.ipAddress = consent.ipAddress;
    }
    if (consent.userAgent !== undefined) {
      result.userAgent = consent.userAgent;
    }
    if (consent.metadata !== undefined) {
      result.metadata = consent.metadata;
    }

    return result;
  }
}
