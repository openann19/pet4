import { useCallback, useEffect } from 'react';
import { useStorage } from '../hooks/use-storage';
import { samplePets, sampleAdoptions, sampleLostReports, samplePosts } from '../data/sampleData';

export default function DataInitializer(): null {
  const [initialized, setInitialized] = useStorage('data-initialized', false);
  const [, setPets] = useStorage('available-pets', []);
  const [, setAdoptions] = useStorage('adoption-listings', []);
  const [, setLostReports] = useStorage('lost-found-reports', []);
  const [, setPosts] = useStorage('community-posts', []);

  const initializeData = useCallback(async () => {
    await setPets(samplePets);
    await setAdoptions(sampleAdoptions);
    await setLostReports(sampleLostReports);
    await setPosts(samplePosts);
    await setInitialized(true);
  }, [setPets, setAdoptions, setLostReports, setPosts, setInitialized]);

  useEffect(() => {
    if (!initialized) {
      void initializeData();
    }
  }, [initialized, initializeData]);

  return null;
}
