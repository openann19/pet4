import { useEffect, useState } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { generateSamplePets } from '@/lib/seedData';
import { initializeCommunityData } from '@/lib/community-seed-data';
import { initializeAdoptionProfiles } from '@/lib/adoption-seed-data';
import type { Pet } from '@/lib/types';
import { createLogger } from '@/lib/logger';

export default function SeedDataInitializer() {
  const [allPets, setAllPets] = useStorage<Pet[]>('all-pets', []);
  const [isInitialized, setIsInitialized] = useStorage<boolean>('data-initialized', false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function initializeData() {
      if (isInitialized || isLoading) return;

      const currentPets = allPets || [];
      if (currentPets.length > 0) {
        setIsInitialized(true);
        await initializeCommunityData();
        await initializeAdoptionProfiles();
        return;
      }

      setIsLoading(true);
      try {
        const samplePets = await generateSamplePets(15); // Generate 15 profiles
        setAllPets(samplePets);
        await initializeCommunityData();
        await initializeAdoptionProfiles();
        setIsInitialized(true);
      } catch (error) {
        const logger = createLogger('SeedDataInitializer');
        logger.error(
          'Failed to initialize sample data',
          error instanceof Error ? error : new Error(String(error))
        );
      } finally {
        setIsLoading(false);
      }
    }

    initializeData();
  }, []);

  return null;
}
