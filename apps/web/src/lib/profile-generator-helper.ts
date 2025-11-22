/**
 * Profile Generator Helper
 *
 * Utility functions to generate pet profiles programmatically
 */

import { generateSamplePets } from './seedData';
import { generateManualProfiles } from './manual-profile-generator';
import { storage } from './storage';
import type { Pet } from './types';
import { logger } from './logger';
import { FixerError } from './fixer-error';

/**
 * Generate 15 pet profiles and add them to the feed
 * This can be called from browser console: window.generateProfiles()
 */
export async function generateProfilesInFeed(count = 15): Promise<Pet[]> {
  try {
    // Ensure count is a valid number
    const validCount = typeof count === 'number' && count > 0 ? count : 15;
    if (typeof count !== 'number' || count <= 0) {
      logger.warn('Invalid count provided, using default', { count, defaultCount: 15 });
    }

    logger.info('Generating pet profiles', { count: validCount });

    // Get current pets from storage
    const currentPets = (await storage.get<Pet[]>('all-pets')) ?? [];

    // Generate new pets
    const newPets = await generateSamplePets(validCount);

    // Combine with existing pets (avoid duplicates by ID)
    const existingIds = new Set(currentPets.map((p) => p.id));
    const uniqueNewPets = newPets.filter((p) => !existingIds.has(p.id));

    // Save to storage
    const allPets = [...currentPets, ...uniqueNewPets];
    await storage.set('all-pets', allPets);

    logger.info('Successfully generated profiles', {
      newProfiles: uniqueNewPets.length,
      totalProfiles: allPets.length,
    });

    return uniqueNewPets;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to generate profiles', err, { action: 'generateProfilesInFeed', count });
    throw new FixerError(
      'Failed to generate profiles',
      { action: 'generateProfilesInFeed', count },
      'PROFILE_GENERATION_ERROR'
    );
  }
}

/**
 * Clear all existing profiles and generate fresh ones
 */
export async function resetAndGenerateProfiles(count = 15): Promise<Pet[]> {
  try {
    logger.info('Resetting and generating fresh profiles', { count });

    // Clear existing
    await storage.set('all-pets', []);

    // Generate new
    const newPets = await generateSamplePets(count);
    await storage.set('all-pets', newPets);

    logger.info('Successfully generated fresh profiles', { count: newPets.length });

    return newPets;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to reset and generate profiles', err, {
      action: 'resetAndGenerateProfiles',
      count,
    });
    throw new FixerError(
      'Failed to reset and generate profiles',
      { action: 'resetAndGenerateProfiles', count },
      'PROFILE_RESET_ERROR'
    );
  }
}

/**
 * Generate profiles manually (no AI required)
 */
export async function generateManualProfilesInFeed(count = 15): Promise<Pet[]> {
  try {
    // Ensure count is a valid number
    const validCount = typeof count === 'number' && count > 0 ? count : 15;
    if (typeof count !== 'number' || count <= 0) {
      logger.warn('Invalid count provided, using default', { count, defaultCount: 15 });
    }

    logger.info('Generating manual profiles (no AI)', { count: validCount });

    const currentPets = (await storage.get<Pet[]>('all-pets')) ?? [];
    const newPets = await generateManualProfiles(validCount);

    const existingIds = new Set(currentPets.map((p) => p.id));
    const uniqueNewPets = newPets.filter((p) => !existingIds.has(p.id));

    const allPets = [...currentPets, ...uniqueNewPets];
    await storage.set('all-pets', allPets);

    logger.info('Generated manual profiles', {
      newProfiles: uniqueNewPets.length,
      totalProfiles: allPets.length,
    });

    return uniqueNewPets;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to generate manual profiles', err, {
      action: 'generateManualProfilesInFeed',
      count,
    });
    throw new FixerError(
      'Failed to generate manual profiles',
      { action: 'generateManualProfilesInFeed', count },
      'MANUAL_PROFILE_GENERATION_ERROR'
    );
  }
}

// Expose to window for browser console access
if (typeof window !== 'undefined') {
  interface WindowWithGenerators extends Window {
    generateProfiles?: (count?: number) => Promise<Pet[]>;
    generateManualProfiles?: (count?: number) => Promise<Pet[]>;
    resetProfiles?: (count?: number) => Promise<Pet[]>;
  }
  const win = window as WindowWithGenerators;
  win.generateProfiles = (count?: number): Promise<Pet[]> => {
    const validCount = typeof count === 'number' && count > 0 ? count : 15;
    return generateProfilesInFeed(validCount);
  };
  win.generateManualProfiles = (count?: number): Promise<Pet[]> => {
    const validCount = typeof count === 'number' && count > 0 ? count : 15;
    return generateManualProfilesInFeed(validCount);
  };
  win.resetProfiles = (count?: number): Promise<Pet[]> => {
    const validCount = typeof count === 'number' && count > 0 ? count : 15;
    return resetAndGenerateProfiles(validCount);
  };
}
