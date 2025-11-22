/**
 * Mock Database Implementation
 *
 * In-memory mock database for development and testing.
 * Replace this with your actual database implementation.
 */

import type {
  GDPRDatabase,
  UserProfile,
  Session,
  Pet,
  Match,
  Chat,
  Post,
  UserPreferences,
  Payment,
  Verification,
  Consent,
} from './gdpr-service';

export class MockDatabase implements GDPRDatabase {
  private users: Map<string, UserProfile> = new Map();
  private sessions: Map<string, Session[]> = new Map();
  private pets: Map<string, Pet[]> = new Map();
  private matches: Map<string, Match[]> = new Map();
  private chats: Map<string, Chat[]> = new Map();
  private posts: Map<string, Post[]> = new Map();
  private preferences: Map<string, UserPreferences> = new Map();
  private payments: Map<string, Payment[]> = new Map();
  private verifications: Map<string, Verification[]> = new Map();
  private consents: Map<string, Consent[]> = new Map();

  constructor() {
    // Initialize with sample data for testing
    this.initializeSampleData();
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    return this.users.get(userId) ?? null;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return this.sessions.get(userId) ?? [];
  }

  async getUserPets(userId: string): Promise<Pet[]> {
    return this.pets.get(userId) ?? [];
  }

  async getUserMatches(userId: string): Promise<Match[]> {
    return this.matches.get(userId) ?? [];
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    return this.chats.get(userId) ?? [];
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return this.posts.get(userId) ?? [];
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return this.preferences.get(userId) ?? null;
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return this.payments.get(userId) ?? [];
  }

  async getUserVerifications(userId: string): Promise<Verification[]> {
    return this.verifications.get(userId) ?? [];
  }

  async getUserConsents(userId: string): Promise<Consent[]> {
    return this.consents.get(userId) ?? [];
  }

  async deleteUserData(userId: string): Promise<{ collections: string[]; records: number }> {
    const collections: string[] = [];
    let records = 0;

    if (this.users.has(userId)) {
      this.users.delete(userId);
      collections.push('users');
      records++;
    }

    const userSessions = this.sessions.get(userId) ?? [];
    if (userSessions.length > 0) {
      this.sessions.delete(userId);
      collections.push('sessions');
      records += userSessions.length;
    }

    const userPets = this.pets.get(userId) ?? [];
    if (userPets.length > 0) {
      this.pets.delete(userId);
      collections.push('pets');
      records += userPets.length;
    }

    const userMatches = this.matches.get(userId) ?? [];
    if (userMatches.length > 0) {
      this.matches.delete(userId);
      collections.push('matches');
      records += userMatches.length;
    }

    const userChats = this.chats.get(userId) ?? [];
    if (userChats.length > 0) {
      this.chats.delete(userId);
      collections.push('chats');
      records += userChats.length;
    }

    const userPosts = this.posts.get(userId) ?? [];
    if (userPosts.length > 0) {
      this.posts.delete(userId);
      collections.push('posts');
      records += userPosts.length;
    }

    if (this.preferences.has(userId)) {
      this.preferences.delete(userId);
      collections.push('preferences');
      records++;
    }

    const userPayments = this.payments.get(userId) ?? [];
    if (userPayments.length > 0) {
      this.payments.delete(userId);
      collections.push('payments');
      records += userPayments.length;
    }

    const userVerifications = this.verifications.get(userId) ?? [];
    if (userVerifications.length > 0) {
      this.verifications.delete(userId);
      collections.push('verifications');
      records += userVerifications.length;
    }

    const userConsents = this.consents.get(userId) ?? [];
    if (userConsents.length > 0) {
      this.consents.delete(userId);
      collections.push('consents');
      records += userConsents.length;
    }

    return { collections, records };
  }

  async getConsentByCategory(userId: string, category: string): Promise<Consent | null> {
    const userConsents = this.consents.get(userId) ?? [];
    return userConsents.find((c) => c.category === category) ?? null;
  }

  async createOrUpdateConsent(consent: Consent): Promise<Consent> {
    const userConsents = this.consents.get(consent.userId) ?? [];
    const existingIndex = userConsents.findIndex((c) => c.id === consent.id);

    if (existingIndex >= 0) {
      userConsents[existingIndex] = consent;
    } else {
      userConsents.push(consent);
    }

    this.consents.set(consent.userId, userConsents);
    return consent;
  }

  private initializeSampleData(): void {
    const userId = 'user1';
    const now = new Date();

    // Sample user
    this.users.set(userId, {
      id: userId,
      email: 'user@example.com',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
      phone: '+1234567890',
      phoneVerified: true,
      ageVerified: true,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      lastSeenAt: now,
    });

    // Sample sessions
    this.sessions.set(userId, [
      {
        id: 'session1',
        userId,
        deviceId: 'device1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        lastActivityAt: now,
      },
    ]);

    // Sample pets
    this.pets.set(userId, [
      {
        id: 'pet1',
        ownerId: userId,
        name: 'Fluffy',
        species: 'cat',
        breed: 'Persian',
        age: 3,
        bio: 'A friendly cat',
        photos: ['https://example.com/pet1.jpg'],
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          city: 'New York',
          country: 'USA',
        },
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
    ]);

    // Sample preferences
    this.preferences.set(userId, {
      userId,
      theme: 'light',
      language: 'en',
      notifications: {
        push: true,
        email: true,
        matches: true,
        messages: true,
        likes: true,
      },
      quietHours: null,
      privacy: {
        profileVisibility: 'public',
        locationSharing: 'approximate',
        onlineStatus: 'visible',
        readReceipts: true,
        activityStatus: true,
        allowStorySharing: true,
        allowAnalytics: false,
      },
    });

    // Sample consents
    this.consents.set(userId, [
      {
        id: 'consent1',
        userId,
        category: 'essential',
        status: 'accepted',
        version: '1.0.0',
        acceptedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'consent2',
        userId,
        category: 'analytics',
        status: 'rejected',
        version: '1.0.0',
        rejectedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
    ]);
  }
}
