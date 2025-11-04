/**
 * GDPR Service
 * 
 * Provides GDPR-compliant data export and deletion functionality
 * Implements right to access (data export) and right to erasure (data deletion)
 */

import { db, type DBRecord } from './database'
import { api } from './api'
import { createLogger } from './logger'
import type { APIError } from './contracts'
import type { UserProfile, Session } from './enhanced-auth'

const logger = createLogger('GDPRService')

export interface UserDataExport {
  user: UserProfile
  sessions: Session[]
  pets: PetData[]
  matches: MatchData[]
  chats: ChatData[]
  posts: PostData[]
  preferences: UserPreferencesData
  payments: PaymentData[]
  verification: VerificationData[]
  metadata: {
    exportDate: string
    exportVersion: string
    userId: string
  }
}

export interface PetData extends DBRecord {
  name: string
  species: string
  breed?: string
  age?: number
  bio?: string
  photos: string[]
  location?: {
    latitude: number
    longitude: number
    city?: string
    country?: string
  }
}

export interface MatchData extends DBRecord {
  petId: string
  matchedPetId: string
  status: 'pending' | 'matched' | 'rejected' | 'expired'
  matchedAt?: string
}

export interface ChatData extends DBRecord {
  matchId: string
  participants: string[]
  messages: MessageData[]
  lastMessageAt?: string
}

export interface MessageData extends DBRecord {
  senderId: string
  content: string
  type: 'text' | 'image' | 'video' | 'system'
  mediaUrl?: string
  readAt?: string
}

export interface PostData extends DBRecord {
  content: string
  mediaUrls: string[]
  visibility: 'public' | 'matches' | 'followers' | 'private'
  status: 'active' | 'archived' | 'deleted'
  reactions: ReactionData[]
  comments: CommentData[]
}

export interface ReactionData {
  userId: string
  type: 'like' | 'love' | 'celebrate'
  createdAt: string
}

export interface CommentData extends DBRecord {
  userId: string
  content: string
  reactions: ReactionData[]
}

export interface UserPreferencesData {
  theme: 'light' | 'dark'
  language: 'en' | 'bg'
  notifications: {
    push: boolean
    email: boolean
    matches: boolean
    messages: boolean
    likes: boolean
  }
  quietHours: {
    start: string
    end: string
  } | null
}

export interface PaymentData extends DBRecord {
  type: 'subscription' | 'purchase' | 'refund'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  productId?: string
  transactionId?: string
}

export interface VerificationData extends DBRecord {
  status: 'pending' | 'verified' | 'rejected'
  level: 'basic' | 'premium' | 'elite'
  verifiedAt?: string
  documents?: string[]
}

export interface DataDeletionResult {
  success: boolean
  deletedCollections: string[]
  deletedRecords: number
  errors: DeletionError[]
}

export interface DeletionError {
  collection: string
  recordId: string
  error: string
}

export class GDPRService {
  /**
   * Export all user data (GDPR Right to Access)
   * Returns a comprehensive JSON export of all user-related data
   */
  async exportUserData(userId: string): Promise<UserDataExport> {
    try {
      logger.debug('Starting data export', { userId })

      const [user, sessions, pets, matches, chats, posts, payments, verificationData] = await Promise.all([
        this.fetchUser(userId),
        this.fetchSessions(userId),
        this.fetchPets(userId),
        this.fetchMatches(userId),
        this.fetchChats(userId),
        this.fetchPosts(userId),
        this.fetchPayments(userId),
        this.fetchVerification(userId)
      ])

      if (!user) {
        throw new Error(`User not found: ${userId}`)
      }

      const preferences: UserPreferencesData = {
        theme: user.preferences.theme,
        language: user.preferences.language,
        notifications: {
          push: user.preferences.notifications.push,
          email: user.preferences.notifications.email,
          matches: user.preferences.notifications.matches,
          messages: user.preferences.notifications.messages,
          likes: user.preferences.notifications.likes
        },
        quietHours: user.preferences.quietHours
      }

      const exportData: UserDataExport = {
        user,
        sessions,
        pets,
        matches,
        chats,
        posts,
        preferences,
        payments,
        verification: verificationData,
        metadata: {
          exportDate: new Date().toISOString(),
          exportVersion: '1.0',
          userId
        }
      }

      logger.debug('Data export completed', {
        userId,
        petsCount: pets.length,
        matchesCount: matches.length,
        chatsCount: chats.length,
        postsCount: posts.length
      })

      return exportData
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Data export failed', new Error(errorMessage), { userId })
      throw new Error(`Failed to export user data: ${errorMessage}`)
    }
  }

  /**
   * Delete all user data (GDPR Right to Erasure)
   * Permanently removes all user-related data from the system
   */
  async deleteUserData(userId: string): Promise<DataDeletionResult> {
    try {
      logger.debug('Starting data deletion', { userId })

      const result: DataDeletionResult = {
        success: true,
        deletedCollections: [],
        deletedRecords: 0,
        errors: []
      }

      const collections = [
        { name: 'sessions', fetcher: () => this.fetchSessions(userId) },
        { name: 'pets', fetcher: () => this.fetchPets(userId) },
        { name: 'matches', fetcher: () => this.fetchMatches(userId) },
        { name: 'chats', fetcher: () => this.fetchChats(userId) },
        { name: 'posts', fetcher: () => this.fetchPosts(userId) },
        { name: 'payments', fetcher: () => this.fetchPayments(userId) },
        { name: 'verification', fetcher: () => Promise.resolve(this.fetchVerification(userId)) }
      ]

      for (const collection of collections) {
        try {
          const records = await collection.fetcher()
          let deletedCount = 0

          if (records && Array.isArray(records)) {
            for (const record of records) {
              try {
                await db.delete(collection.name, record.id)
                deletedCount++
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error)
                result.errors.push({
                  collection: collection.name,
                  recordId: record.id,
                  error: errorMessage
                })
                result.success = false
              }
            }
          }

          if (deletedCount > 0) {
            result.deletedCollections.push(collection.name)
            result.deletedRecords += deletedCount
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          logger.error('Failed to delete collection', new Error(errorMessage), {
            userId,
            collection: collection.name
          })
          result.success = false
          result.errors.push({
            collection: collection.name,
            recordId: 'unknown',
            error: errorMessage
          })
        }
      }

      try {
        await db.delete<UserProfile>('users', userId)
        result.deletedCollections.push('users')
        result.deletedRecords++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error('Failed to delete user', new Error(errorMessage), { userId })
        result.success = false
        result.errors.push({
          collection: 'users',
          recordId: userId,
          error: errorMessage
        })
      }

      if (result.success) {
        logger.debug('Data deletion completed', {
          userId,
          deletedCollections: result.deletedCollections.length,
          deletedRecords: result.deletedRecords
        })
      } else {
        logger.warn('Data deletion completed with errors', {
          userId,
          deletedRecords: result.deletedRecords,
          errorCount: result.errors.length
        })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Data deletion failed', new Error(errorMessage), { userId })
      throw new Error(`Failed to delete user data: ${errorMessage}`)
    }
  }

  /**
   * Request data export via API (for authenticated requests)
   */
  async requestDataExport(userId: string): Promise<UserDataExport> {
    try {
      const response = await api.get<UserDataExport>(`/api/gdpr/export/${userId}`)
      logger.debug('Data export requested via API', { userId })
      return response
    } catch (error) {
      const apiError = error as APIError
      logger.error('API data export failed', new Error(apiError.message), {
        userId,
        code: apiError.code
      })
      throw error
    }
  }

  /**
   * Request data deletion via API (for authenticated requests)
   */
  async requestDataDeletion(userId: string): Promise<DataDeletionResult> {
    try {
      const response = await api.post<DataDeletionResult>(`/api/gdpr/delete/${userId}`, {})
      logger.debug('Data deletion requested via API', { userId })
      return response
    } catch (error) {
      const apiError = error as APIError
      logger.error('API data deletion failed', new Error(apiError.message), {
        userId,
        code: apiError.code
      })
      throw error
    }
  }

  private async fetchUser(userId: string): Promise<UserProfile | null> {
    return await db.findById<UserProfile>('users', userId)
  }

  private async fetchSessions(userId: string): Promise<Session[]> {
    const result = await db.findMany<Session>('sessions', {
      filter: { userId }
    })
    return result.data
  }

  private async fetchPets(userId: string): Promise<PetData[]> {
    const result = await db.findMany<PetData>('pets', {
      filter: { ownerId: userId }
    })
    return result.data
  }

  private async fetchMatches(userId: string): Promise<MatchData[]> {
    const result = await db.findMany<MatchData>('matches', {
      filter: { ownerId: userId }
    })
    return result.data
  }

  private async fetchChats(userId: string): Promise<ChatData[]> {
    const result = await db.findMany<ChatData>('chats', {
      filter: { ownerId: userId }
    })
    return result.data
  }

  private async fetchPosts(userId: string): Promise<PostData[]> {
    const result = await db.findMany<PostData>('posts', {
      filter: { ownerId: userId }
    })
    return result.data
  }

  private async fetchPayments(userId: string): Promise<PaymentData[]> {
    const result = await db.findMany<PaymentData>('payments', {
      filter: { ownerId: userId }
    })
    return result.data
  }

  private async fetchVerification(userId: string): Promise<VerificationData[]> {
    const result = await db.findMany<VerificationData>('verification', {
      filter: { ownerId: userId } as Partial<VerificationData>
    })
    return result.data
  }
}

export const gdprService = new GDPRService()

