import { useMemo } from 'react';
import type { CreatePetFormActions } from '../create-pet-types';

export function useCreateFormActions(
  setFormState: React.Dispatch<React.SetStateAction<import('../create-pet-types').CreatePetFormState>>,
  resetForm: () => void
): CreatePetFormActions {
  return useMemo(
    () => ({
      setCurrentStep: (step) => {
        setFormState((prev) => ({ ...prev, currentStep: step }));
      },
      setPetType: (type) => {
        setFormState((prev) => ({ ...prev, petType: type }));
      },
      setName: (name) => {
        setFormState((prev) => ({ ...prev, name }));
      },
      setBreed: (breed) => {
        setFormState((prev) => ({ ...prev, breed }));
      },
      setAge: (age) => {
        setFormState((prev) => ({ ...prev, age }));
      },
      setGender: (gender) => {
        setFormState((prev) => ({ ...prev, gender }));
      },
      setSize: (size) => {
        setFormState((prev) => ({ ...prev, size }));
      },
      setPhoto: (photo) => {
        setFormState((prev) => ({ ...prev, photo }));
      },
      setBio: (bio) => {
        setFormState((prev) => ({ ...prev, bio }));
      },
      setLocation: (location) => {
        setFormState((prev) => ({ ...prev, location }));
      },
      setPersonality: (personality) => {
        setFormState((prev) => ({ ...prev, personality }));
      },
      setInterests: (interests) => {
        setFormState((prev) => ({ ...prev, interests }));
      },
      setLookingFor: (lookingFor) => {
        setFormState((prev) => ({ ...prev, lookingFor }));
      },
      resetForm,
    }),
    [setFormState, resetForm]
  );
}

