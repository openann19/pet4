import { useCallback } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { toast } from 'sonner';
import type { Pet } from '@/lib/types';
import type { CreatePetFormState } from '../create-pet-types';

export function useCreatePetSubmission(
  formState: CreatePetFormState,
  editingPet?: Pet | null,
  onClose?: () => void
) {
  const [, setUserPets] = useStorage<Pet[]>('user-pets', []);
  const [, setAllPets] = useStorage<Pet[]>('all-pets', []);

  const handleSubmit = useCallback(() => {
    const { name, breed, age, photo, location } = formState;

    if (!name || !breed || !age || !photo || !location) {
      toast.error('Please complete all required fields');
      return;
    }

    const petData: Pet = {
      id: editingPet?.id ?? `pet-${String(Date.now())}`,
      name,
      breed,
      age: parseInt(age),
      gender: formState.gender,
      size: formState.size,
      photo,
      photos: [photo],
      bio: formState.bio,
      location,
      personality: formState.personality,
      interests: formState.interests,
      lookingFor: formState.lookingFor,
      ownerId: 'user-1',
      ownerName: 'You',
      verified: false,
      createdAt: editingPet?.createdAt ?? new Date().toISOString(),
    };

    if (editingPet) {
      void setUserPets((current) =>
        (current ?? []).map((p) => (p.id === editingPet.id ? petData : p))
      );
      void setAllPets((current) =>
        (current ?? []).map((p) => (p.id === editingPet.id ? petData : p))
      );

      toast.success('Pet profile updated!', {
        description: `${name}'s profile has been updated successfully.`,
      });
    } else {
      void setUserPets((current) => [...(current ?? []), petData]);
      void setAllPets((current) => [...(current ?? []), petData]);
      toast.success('Pet profile created! 🎉', {
        description: `${name} is ready to find perfect companions!`,
      });
    }

    onClose?.();
  }, [formState, editingPet, setUserPets, setAllPets, onClose]);

  return { handleSubmit };
}

