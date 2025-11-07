import { useEffect } from 'react';
import { useStorage } from '../hooks/useStorage';
import { samplePets, sampleAdoptions, sampleLostReports, samplePosts } from '../data/sampleData';

export default function DataInitializer(): null {
  const [initialized, setInitialized] = useStorage('data-initialized', false);
  const [, setPets] = useStorage('available-pets', []);
  const [, setAdoptions] = useStorage('adoption-listings', []);
  const [, setLostReports] = useStorage('lost-found-reports', []);
  const [, setPosts] = useStorage('community-posts', []);

  useEffect(() => {
    if (!initialized) {
      initializeData();
    }
  }, [initialized]);

  const initializeData = async () => {
    await setPets(samplePets);
    await setAdoptions(sampleAdoptions);
    await setLostReports(sampleLostReports);
    await setPosts(samplePosts);
    await setInitialized(true);
  };

  return null;
}
