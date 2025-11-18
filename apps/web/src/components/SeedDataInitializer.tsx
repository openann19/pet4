import { useEffect, useState, useRef, useCallback } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { generateSamplePets } from '@/lib/seedData';
import { initializeCommunityData } from '@/lib/community-seed-data';
import { initializeAdoptionProfiles } from '@/lib/adoption-seed-data';
import type { Pet } from '@/lib/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SeedDataInitializer');

export default function SeedDataInitializer(): null {
  const [allPets, setAllPets] = useStorage<Pet[]>('all-pets', []);
  const [isInitialized, setIsInitialized] = useStorage<boolean>('data-initialized', false);
  const [isLoading, setIsLoading] = useState(false);
  const initializationAttemptedRef = useRef(false);

  const initializeData = useCallback(async (): Promise<void> => {
    if (initializationAttemptedRef.current || isInitialized || isLoading) {
      return;
    }

    initializationAttemptedRef.current = true;

    // If pets already exist, just mark as initialized
    if (allPets.length > 0) {
      try {
        await setIsInitialized(true);
        await initializeCommunityData();
        await initializeAdoptionProfiles();
      } catch (_error) {
        logger.error(
          'Failed to mark data as initialized',
          _error instanceof Error ? _error : new Error(String(_error))
        );
        initializationAttemptedRef.current = false;
      }
      return;
    }

    // Generate new sample data
    setIsLoading(true);
    try {
      const samplePets = await generateSamplePets(15);
      await setAllPets(samplePets);
      await initializeCommunityData();
      await initializeAdoptionProfiles();
      await setIsInitialized(true);
    } catch (_error) {
      logger.error(
        'Failed to initialize sample data',
        _error instanceof Error ? _error : new Error(String(_error))
      );
      initializationAttemptedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading, allPets.length, setAllPets, setIsInitialized]);

  useEffect(() => {
    void initializeData();
  }, [initializeData]);

  return null;
}
