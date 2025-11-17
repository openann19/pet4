/**
 * PostgreSQL Database Implementation
 *
 * PostgreSQL adapter for GDPRDatabase interface.
 * Connects to PostgreSQL database and implements all GDPR data access methods.
 */

import { Pool } from 'pg';
import type {
  GDPRDatabase,
  UserProfile,
  Session,
  Pet,
  Match,
  Chat,
  Message,
  Post,
  UserPreferences,
  Payment,
  Verification,
  Consent,
} from './gdpr-service';
import { createLogger } from '../utils/logger';

const logger = createLogger('PostgresDatabase');

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class PostgresDatabase implements GDPRDatabase {
  private pool: Pool;

  constructor(config: PostgresConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl,
      max: config.max ?? 20,
      idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis ?? 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<UserProfile>(
        `SELECT
          id, email, "displayName" as "displayName",
          "avatarUrl" as "avatarUrl", phone, "phoneVerified" as "phoneVerified",
          "ageVerified" as "ageVerified", "createdAt" as "createdAt",
          "lastSeenAt" as "lastSeenAt", metadata
        FROM users
        WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapUserProfile(result.rows[0]);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user by ID', err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<Session>(
        `SELECT
          id, "userId" as "userId", "deviceId" as "deviceId",
          "ipAddress" as "ipAddress", "userAgent" as "userAgent",
          "createdAt" as "createdAt", "expiresAt" as "expiresAt",
          "lastActivityAt" as "lastActivityAt"
        FROM sessions
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC`,
        [userId]
      );

      return result.rows.map(this.mapSession);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user sessions', err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  async getUserPets(userId: string): Promise<Pet[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<Pet>(
        `SELECT
          id, "ownerId" as "ownerId", name, species, breed, age, bio,
          photos, location, "createdAt" as "createdAt", "updatedAt" as "updatedAt"
        FROM pets
        WHERE "ownerId" = $1
        ORDER BY "createdAt" DESC`,
        [userId]
      );

      return result.rows.map(this.mapPet);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user pets', err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  async getUserMatches(userId: string): Promise<Match[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<Match>(
        `SELECT
          id, "petId" as "petId", "matchedPetId" as "matchedPetId",
          "ownerId" as "ownerId", status, "matchedAt" as "matchedAt",
          "createdAt" as "createdAt", "updatedAt" as "updatedAt"
        FROM matches
        WHERE "ownerId" = $1
        ORDER BY "createdAt" DESC`,
        [userId]
      );

      return result.rows.map(this.mapMatch);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user matches', err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    const client = await this.pool.connect();
    try {
      // Get chats where user is a participant
      const chatResult = await client.query<{
        id: string;
        matchId: string;
        participants: string[];
        lastMessageAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      }>(
        `SELECT
          c.id, c."matchId" as "matchId", c.participants,
          c."lastMessageAt" as "lastMessageAt",
          c."createdAt" as "createdAt", c."updatedAt" as "updatedAt"
        FROM chats c
        WHERE $1 = ANY(c.participants)
        ORDER BY c."lastMessageAt" DESC NULLS LAST, c."createdAt" DESC`,
        [userId]
      );

      // Get messages for each chat
      const chats: Chat[] = [];
      for (const chatRow of chatResult.rows) {
        const messageResult = await client.query<{
          id: string;
          senderId: string;
          content: string;
          type: string;
          mediaUrl: string | null;
          readAt: Date | null;
          createdAt: Date;
          updatedAt: Date;
        }>(
          `SELECT
            id, "senderId" as "senderId", content, type,
            "mediaUrl" as "mediaUrl", "readAt" as "readAt",
            "createdAt" as "createdAt", "updatedAt" as "updatedAt"
          FROM messages
          WHERE "chatId" = $1
          ORDER BY "createdAt" ASC`,
          [chatRow.id]
        );

        chats.push({
          id: chatRow.id,
          matchId: chatRow.matchId,
          participants: chatRow.participants,
          messages: messageResult.rows.map(this.mapMessage),
          lastMessageAt: chatRow.lastMessageAt ?? undefined,
          createdAt: chatRow.createdAt,
          updatedAt: chatRow.updatedAt,
        });
      }

      return chats;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user chats', err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    const client = await this.pool.connect();
    try {
      const postResult = await client.query<{
        id: string;
        authorId: string;
        content: string;
        mediaUrls: string[];
        visibility: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
      }>(
        `SELECT
          id, "authorId" as "authorId", content, "mediaUrls" as "mediaUrls",
          visibility, status, "createdAt" as "createdAt", "updatedAt" as "updatedAt"
        FROM posts
        WHERE "authorId" = $1
        ORDER BY "createdAt" DESC`,
        [userId]
      );

      const posts: Post[] = [];
      for (const postRow of postResult.rows) {
        // Get reactions
        const reactionResult = await client.query<{
          userId: string;
          type: string;
          createdAt: Date;
        }>(
          `SELECT "userId" as "userId", type, "createdAt" as "createdAt"
          FROM post_reactions
          WHERE "postId" = $1
          ORDER BY "createdAt" DESC`,
          [postRow.id]
        );

        // Get comments
        const commentResult = await client.query<{
          id: string;
          userId: string;
          content: string;
          createdAt: Date;
          updatedAt: Date;
        }>(
          `SELECT
            id, "userId" as "userId", content,
            "createdAt" as "createdAt", "updatedAt" as "updatedAt"
          FROM post_comments
          WHERE "postId" = $1
          ORDER BY "createdAt" ASC`,
          [postRow.id]
        );

        // Get comment reactions
        const commentReactions: Map<string, Array<{ userId: string; type: string; createdAt: Date }>> = new Map();
        for (const comment of commentResult.rows) {
          const commentReactionResult = await client.query<{
            userId: string;
            type: string;
            createdAt: Date;
          }>(
            `SELECT "userId" as "userId", type, "createdAt" as "createdAt"
            FROM comment_reactions
            WHERE "commentId" = $1
            ORDER BY "createdAt" DESC`,
            [comment.id]
          );
          commentReactions.set(comment.id, commentReactionResult.rows);
        }

        posts.push({
          id: postRow.id,
          authorId: postRow.authorId,
          content: postRow.content,
          mediaUrls: postRow.mediaUrls,
          visibility: postRow.visibility as Post['visibility'],
          status: postRow.status as Post['status'],
          reactions: reactionResult.rows.map((r) => ({
            userId: r.userId,
            type: r.type as Post['reactions'][number]['type'],
            createdAt: r.createdAt,
          })),
          comments: commentResult.rows.map((c) => ({
            id: c.id,
            userId: c.userId,
            content: c.content,
            reactions:
              commentReactions.get(c.id)?.map((r) => ({
                userId: r.userId,
                type: r.type as Post['reactions'][number]['type'],
                createdAt: r.createdAt,
              })) ?? [],
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })),
          createdAt: postRow.createdAt,
          updatedAt: postRow.updatedAt,
        });
      }

      return posts;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user posts', err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<UserPreferences>(
        `SELECT
          "userId" as "userId", theme, language, notifications,
          "quietHours" as "quietHours", privacy
        FROM user_preferences
        WHERE "userId" = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapUserPreferences(result.rows[0]);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user preferences', err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<Payment>(
        `SELECT
          id, "userId" as "userId", type, amount, currency, status,
          "productId" as "productId", "transactionId" as "transactionId",
          "createdAt" as "createdAt", "updatedAt" as "updatedAt"
        FROM payments
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC`,
        [userId]
      );

      return result.rows.map(this.mapPayment);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user payments', err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  async getUserVerifications(userId: string): Promise<Verification[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<Verification>(
        `SELECT
          id, "userId" as "userId", status, level, "verifiedAt" as "verifiedAt",
          documents, "createdAt" as "createdAt", "updatedAt" as "updatedAt"
        FROM verifications
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC`,
        [userId]
      );

      return result.rows.map(this.mapVerification);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user verifications', err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  async getUserConsents(userId: string): Promise<Consent[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<Consent>(
        `SELECT
          id, "userId" as "userId", category, status, version,
          "acceptedAt" as "acceptedAt", "rejectedAt" as "rejectedAt",
          "withdrawnAt" as "withdrawnAt", "ipAddress" as "ipAddress",
          "userAgent" as "userAgent", metadata
        FROM consents
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC`,
        [userId]
      );

      return result.rows.map(this.mapConsent);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get user consents', err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteUserData(userId: string): Promise<{ collections: string[]; records: number }> {
    const client = await this.pool.connect();
    const collections: string[] = [];
    let totalRecords = 0;

    try {
      await client.query('BEGIN');

      // Delete in order to respect foreign key constraints
      const deleteOperations: Array<{ table: string; query: string; params: string[] }> = [
        { table: 'comment_reactions', query: 'DELETE FROM comment_reactions WHERE "commentId" IN (SELECT id FROM post_comments WHERE "postId" IN (SELECT id FROM posts WHERE "authorId" = $1))', params: [userId] },
        { table: 'post_comments', query: 'DELETE FROM post_comments WHERE "postId" IN (SELECT id FROM posts WHERE "authorId" = $1)', params: [userId] },
        { table: 'post_reactions', query: 'DELETE FROM post_reactions WHERE "postId" IN (SELECT id FROM posts WHERE "authorId" = $1)', params: [userId] },
        { table: 'posts', query: 'DELETE FROM posts WHERE "authorId" = $1', params: [userId] },
        { table: 'messages', query: 'DELETE FROM messages WHERE "chatId" IN (SELECT id FROM chats WHERE $1 = ANY(participants))', params: [userId] },
        { table: 'chats', query: 'DELETE FROM chats WHERE $1 = ANY(participants)', params: [userId] },
        { table: 'matches', query: 'DELETE FROM matches WHERE "ownerId" = $1', params: [userId] },
        { table: 'pets', query: 'DELETE FROM pets WHERE "ownerId" = $1', params: [userId] },
        { table: 'payments', query: 'DELETE FROM payments WHERE "userId" = $1', params: [userId] },
        { table: 'verifications', query: 'DELETE FROM verifications WHERE "userId" = $1', params: [userId] },
        { table: 'consents', query: 'DELETE FROM consents WHERE "userId" = $1', params: [userId] },
        { table: 'user_preferences', query: 'DELETE FROM user_preferences WHERE "userId" = $1', params: [userId] },
        { table: 'sessions', query: 'DELETE FROM sessions WHERE "userId" = $1', params: [userId] },
        { table: 'users', query: 'DELETE FROM users WHERE id = $1', params: [userId] },
      ];

      for (const operation of deleteOperations) {
        const result = await client.query(operation.query, operation.params);
        const rowCount = result.rowCount ?? 0;
        if (rowCount > 0) {
          collections.push(operation.table);
          totalRecords += rowCount;
        }
      }

      await client.query('COMMIT');

      logger.info('User data deleted successfully', {
        userId,
        collections,
        records: totalRecords,
      });

      return { collections, records: totalRecords };
    } catch (error) {
      await client.query('ROLLBACK');
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete user data', err, { userId });
      throw err;
    } finally {
      client.release();
    }
  }

  async getConsentByCategory(userId: string, category: string): Promise<Consent | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<Consent>(
        `SELECT
          id, "userId" as "userId", category, status, version,
          "acceptedAt" as "acceptedAt", "rejectedAt" as "rejectedAt",
          "withdrawnAt" as "withdrawnAt", "ipAddress" as "ipAddress",
          "userAgent" as "userAgent", metadata
        FROM consents
        WHERE "userId" = $1 AND category = $2
        ORDER BY "createdAt" DESC
        LIMIT 1`,
        [userId, category]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapConsent(result.rows[0]);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get consent by category', err, { userId, category });
      throw err;
    } finally {
      client.release();
    }
  }

  async createOrUpdateConsent(consent: Consent): Promise<Consent> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<Consent>(
        `INSERT INTO consents (
          id, "userId", category, status, version,
          "acceptedAt", "rejectedAt", "withdrawnAt",
          "ipAddress", "userAgent", metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          status = $4,
          version = $5,
          "acceptedAt" = $6,
          "rejectedAt" = $7,
          "withdrawnAt" = $8,
          "ipAddress" = $9,
          "userAgent" = $10,
          metadata = $11,
          "updatedAt" = NOW()
        RETURNING
          id, "userId" as "userId", category, status, version,
          "acceptedAt" as "acceptedAt", "rejectedAt" as "rejectedAt",
          "withdrawnAt" as "withdrawnAt", "ipAddress" as "ipAddress",
          "userAgent" as "userAgent", metadata, "createdAt" as "createdAt", "updatedAt" as "updatedAt"`,
        [
          consent.id,
          consent.userId,
          consent.category,
          consent.status,
          consent.version,
          consent.acceptedAt ?? null,
          consent.rejectedAt ?? null,
          consent.withdrawnAt ?? null,
          consent.ipAddress ?? null,
          consent.userAgent ?? null,
          consent.metadata ? JSON.stringify(consent.metadata) : null,
        ]
      );

      return this.mapConsent(result.rows[0]);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create or update consent', err, {
        userId: consent.userId,
        category: consent.category,
      });
      throw err;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // Mapping functions
  private mapUserProfile(row: unknown): UserProfile {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      email: r.email as string,
      displayName: r.displayName as string,
      avatarUrl: r.avatarUrl as string | undefined,
      phone: r.phone as string | undefined,
      phoneVerified: r.phoneVerified as boolean | undefined,
      ageVerified: r.ageVerified as boolean,
      createdAt: r.createdAt as Date,
      lastSeenAt: r.lastSeenAt as Date,
      metadata: r.metadata as Record<string, unknown> | undefined,
    };
  }

  private mapSession(row: unknown): Session {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.userId as string,
      deviceId: r.deviceId as string | undefined,
      ipAddress: r.ipAddress as string | undefined,
      userAgent: r.userAgent as string | undefined,
      createdAt: r.createdAt as Date,
      expiresAt: r.expiresAt as Date | undefined,
      lastActivityAt: r.lastActivityAt as Date | undefined,
    };
  }

  private mapPet(row: unknown): Pet {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      ownerId: r.ownerId as string,
      name: r.name as string,
      species: r.species as string,
      breed: r.breed as string | undefined,
      age: r.age as number | undefined,
      bio: r.bio as string | undefined,
      photos: r.photos as string[],
      location: r.location as Pet['location'] | undefined,
      createdAt: r.createdAt as Date,
      updatedAt: r.updatedAt as Date,
    };
  }

  private mapMatch(row: unknown): Match {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      petId: r.petId as string,
      matchedPetId: r.matchedPetId as string,
      ownerId: r.ownerId as string,
      status: r.status as Match['status'],
      matchedAt: r.matchedAt as Date | undefined,
      createdAt: r.createdAt as Date,
      updatedAt: r.updatedAt as Date,
    };
  }

  private mapMessage(row: unknown): Message {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      senderId: r.senderId as string,
      content: r.content as string,
      type: r.type as Message['type'],
      mediaUrl: r.mediaUrl as string | undefined,
      readAt: r.readAt as Date | undefined,
      createdAt: r.createdAt as Date,
      updatedAt: r.updatedAt as Date,
    };
  }

  private mapUserPreferences(row: unknown): UserPreferences {
    const r = row as Record<string, unknown>;
    return {
      userId: r.userId as string,
      theme: r.theme as UserPreferences['theme'],
      language: r.language as UserPreferences['language'],
      notifications: r.notifications as UserPreferences['notifications'],
      quietHours: r.quietHours as UserPreferences['quietHours'],
      privacy: r.privacy as UserPreferences['privacy'],
    };
  }

  private mapPayment(row: unknown): Payment {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.userId as string,
      type: r.type as Payment['type'],
      amount: r.amount as number,
      currency: r.currency as string,
      status: r.status as Payment['status'],
      productId: r.productId as string | undefined,
      transactionId: r.transactionId as string | undefined,
      createdAt: r.createdAt as Date,
      updatedAt: r.updatedAt as Date,
    };
  }

  private mapVerification(row: unknown): Verification {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.userId as string,
      status: r.status as Verification['status'],
      level: r.level as Verification['level'],
      verifiedAt: r.verifiedAt as Date | undefined,
      documents: r.documents as string[] | undefined,
      createdAt: r.createdAt as Date,
      updatedAt: r.updatedAt as Date,
    };
  }

  private mapConsent(row: unknown): Consent {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.userId as string,
      category: r.category as Consent['category'],
      status: r.status as Consent['status'],
      version: r.version as string,
      acceptedAt: r.acceptedAt as Date | undefined,
      rejectedAt: r.rejectedAt as Date | undefined,
      withdrawnAt: r.withdrawnAt as Date | undefined,
      ipAddress: r.ipAddress as string | undefined,
      userAgent: r.userAgent as string | undefined,
      metadata: r.metadata as Record<string, unknown> | undefined,
    };
  }
}
