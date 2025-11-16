import { useMemo } from 'react';
import type { CreatePetFormState } from '../create-pet-types';

export function useCreatePetValidation(formState: CreatePetFormState) {
  const canProceed = useMemo(() => {
    const { currentStep, petType, name, breed, age, gender, size, location, photo, personality, interests, lookingFor } = formState;

    switch (currentStep) {
      case 'type':
        return !!petType;
      case 'template':
        return true;
      case 'basics':
        return !!(name && breed && age);
      case 'characteristics':
        return !!(gender && size && location);
      case 'photo':
        return !!photo;
      case 'personality':
        return personality.length > 0;
      case 'preferences':
        return interests.length > 0 && lookingFor.length > 0;
      case 'complete':
        return true;
      default:
        return false;
    }
  }, [formState]);

  const isFormValid = useMemo(() => {
    const { name, breed, age, photo, location } = formState;
    return !!(name && breed && age && photo && location);
  }, [formState]);

  return {
    canProceed,
    isFormValid,
  };
}

