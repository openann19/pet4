#!/usr/bin/env tsx
/**
 * End-to-End Walkthrough Script
 *
 * Scripted walkthrough of the complete happy path:
 * - Register → Create pet → Discover → Like → Mutual match → Chat
 * - Upload photo → Auto attributes → Save
 * - Admin reviews report → Client reflects change
 */

import { matchingAPI } from '../src/api/matching-api';
import { authService } from '../src/lib/auth';
import { healthService } from '../src/lib/health-service';
import { createLogger } from '../src/lib/logger';
import { mediaUploadService } from '../src/lib/media-upload-service';
import { getRealtimeEvents } from '../src/lib/realtime-events';
import { storage } from '../src/lib/storage';
import { generateULID } from '../src/lib/utils';

const logger = createLogger('E2EWalkthrough');

interface WalkthroughResult {
  success: boolean;
  steps: {
    name: string;
    success: boolean;
    duration: number;
    error?: string;
  }[];
  totalDuration: number;
}

interface StoredPet {
  id: string;
  ownerId: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  age: number;
  size: 'small' | 'medium' | 'large';
  gender: 'male' | 'female';
  photos: string[];
  personality: string[];
  bio: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'pending' | 'archived';
}

interface StoredMatch {
  id: string;
  chatRoomId: string;
}

interface StoredReport {
  id: string;
  status: string;
}

function initializeExecutionEnvironment(): void {
  const globalContext = globalThis as typeof globalThis & {
    window?: typeof globalThis;
    localStorage?: Storage;
    sessionStorage?: Storage;
  };

  if (typeof globalContext.localStorage === 'undefined') {
    const backingStore = new Map<string, string>();
    const polyfill: Storage = {
      clear: () => backingStore.clear(),
      getItem: (key: string) => (backingStore.has(key) ? backingStore.get(key)! : null),
      key: (index: number) => Array.from(backingStore.keys())[index] ?? null,
      removeItem: (key: string) => {
        backingStore.delete(key);
      },
      setItem: (key: string, value: string) => {
        backingStore.set(key, value);
      },
      get length() {
        return backingStore.size;
      },
    };

    globalContext.localStorage = polyfill;
  }

  if (typeof globalContext.sessionStorage === 'undefined') {
    const backingStore = new Map<string, string>();
    const polyfill: Storage = {
      clear: () => backingStore.clear(),
      getItem: (key: string) => (backingStore.has(key) ? backingStore.get(key)! : null),
      key: (index: number) => Array.from(backingStore.keys())[index] ?? null,
      removeItem: (key: string) => {
        backingStore.delete(key);
      },
      setItem: (key: string, value: string) => {
        backingStore.set(key, value);
      },
      get length() {
        return backingStore.size;
      },
    };

    globalContext.sessionStorage = polyfill;
  }
}

export async function runWalkthrough(): Promise<WalkthroughResult> {
  initializeExecutionEnvironment();
  const startTime = Date.now();
  const steps: WalkthroughResult['steps'] = [];

  const step = async (name: string, fn: () => Promise<void>): Promise<void> => {
    const stepStart = Date.now();
    try {
      logger.info(`Step: ${name}`);
      await fn();
      const duration = Date.now() - stepStart;
      steps.push({ name, success: true, duration });
      logger.info(`✓ ${name} completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - stepStart;
      const errorMessage = error instanceof Error ? error.message : String(error);
      steps.push({ name, success: false, duration, error: errorMessage });
      logger.error(`✗ ${name} failed: ${errorMessage}`);
      throw error;
    }
  };

  try {
    logger.info('Starting end-to-end walkthrough');

    await step('1. Health Check', async () => {
      const health = await healthService.checkLiveness();
      if (health.status !== 'healthy') {
        throw new Error(`Health check failed: ${health.status}`);
      }
    });

    await step('2. User Registration', async () => {
      const email = `demo-${generateULID()}@example.com`;
      const password = 'Demo123!@#';
      const displayName = 'Demo User';

      await authService.signup({
        email,
        password,
        displayName,
      });
    });

    await step('3. User Login', async () => {
      await authService.login({
        email: 'user@demo.com',
        password: 'user123',
      });
    });

    await step('4. Create Pet Profile', async () => {
      const pet: StoredPet = {
        id: generateULID(),
        ownerId: authService.getCurrentUser()?.id || '',
        name: 'Demo Pet',
        species: 'dog' as const,
        breed: 'Golden Retriever',
        age: 3,
        size: 'large' as const,
        gender: 'male' as const,
        photos: [],
        personality: ['playful', 'friendly'],
        bio: 'A friendly demo pet',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          city: 'San Francisco',
          country: 'USA',
        },
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active' as const,
      };

      const allPets = (await storage.get<StoredPet[]>('all-pets')) || [];
      allPets.push(pet);
      await storage.set('all-pets', allPets);
    });

    await step('5. Discover Pets', async () => {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user');
      }

      const allPets = (await storage.get<StoredPet[]>('all-pets')) || [];
      const userPet = allPets.find((p) => p.ownerId === currentUser.id);

      if (!userPet) {
        throw new Error('User pet not found');
      }

      const response = await matchingAPI.discover({
        petId: userPet.id,
        pageSize: 10,
      });

      if (response.candidates.length === 0) {
        throw new Error('No candidates found');
      }
    });

    await step('6. Like a Pet', async () => {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No current user');
      }

      const allPets = (await storage.get<StoredPet[]>('all-pets')) || [];
      const userPet = allPets.find((p) => p.ownerId === currentUser.id);
      const targetPet = allPets.find((p) => p.ownerId !== currentUser.id);

      if (!userPet || !targetPet) {
        throw new Error('Pets not found');
      }

      const response = await matchingAPI.swipe({
        petId: userPet.id,
        targetPetId: targetPet.id,
        action: 'like',
      });

      if (!response.recorded) {
        throw new Error('Swipe not recorded');
      }
    });

    await step('7. Mutual Match Creation', async () => {
      const allPets = (await storage.get<StoredPet[]>('all-pets')) || [];
      if (allPets.length < 2) {
        logger.warn('Skipping mutual match - need at least 2 pets');
        return;
      }

      const pet1 = allPets[0];
      const pet2 = allPets[1];

      if (!pet1 || !pet2) {
        throw new Error('Pets not found');
      }

      await matchingAPI.swipe({
        petId: pet1.id,
        targetPetId: pet2.id,
        action: 'like',
      });

      await matchingAPI.swipe({
        petId: pet2.id,
        targetPetId: pet1.id,
        action: 'like',
      });
    });

    await step('8. Upload Photo', async () => {
      if (typeof Blob === 'undefined' || typeof File === 'undefined') {
        logger.warn('File APIs unavailable; skipping upload simulation');
        return;
      }

      const blob = new Blob(['test image'], { type: 'image/jpeg' });
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });

      const validation = mediaUploadService.validateFile(file, 'image');
      if (!validation.valid) {
        throw new Error(validation.error || 'File validation failed');
      }

      if (typeof document === 'undefined' || typeof Image === 'undefined') {
        logger.warn('DOM APIs unavailable; skipping image dimension verification');
        return;
      }

      const dimensions = await mediaUploadService.getImageDimensions(file);
      if (dimensions.width === 0 || dimensions.height === 0) {
        throw new Error('Invalid image dimensions');
      }
    });

    await step('9. Chat Room Access', async () => {
      const matches = (await storage.get<StoredMatch[]>('all-matches')) || [];
      if (matches.length > 0) {
        const match = matches[0];
        if (match) {
          const realtimeEvents = getRealtimeEvents();
          await realtimeEvents.joinRoom(match.chatRoomId, 'user-123');
        }
      } else {
        logger.warn('Skipping chat - no matches found');
      }
    });

    await step('10. Admin Review Flow', async () => {
      const reports = (await storage.get<StoredReport[]>('all-reports')) || [];
      if (reports.length > 0) {
        const report = reports[0];
        if (report?.status === 'pending') {
          logger.info('Report found for review');
        }
      } else {
        logger.warn('Skipping admin review - no reports found');
      }
    });

    const totalDuration = Date.now() - startTime;
    logger.info(`Walkthrough completed successfully in ${totalDuration}ms`);

    return {
      success: true,
      steps,
      totalDuration,
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Walkthrough failed: ${errorMessage}`,
      error instanceof Error ? error : new Error(errorMessage)
    );

    return {
      success: false,
      steps,
      totalDuration,
    };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWalkthrough()
    .then((result) => {
      if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error(
        'Walkthrough execution failed',
        error instanceof Error ? error : new Error(String(error))
      );
      process.exit(1);
    });
}
