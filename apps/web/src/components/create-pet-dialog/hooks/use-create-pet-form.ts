import { useState, useEffect, useCallback } from 'react';
import type { Pet } from '@/lib/types';
import type { PetType } from '@/lib/pet-profile-templates';
import type { PetProfileTemplate } from '@/lib/pet-profile-templates';
import type { CreatePetFormState } from '../create-pet-types';
import { useCreateFormActions } from './create-form-actions';
import { useStepNavigation } from './use-step-navigation';
import { useTemplateApplication } from './use-template-application';

const INITIAL_STATE: CreatePetFormState = {
  currentStep: 'type',
  petType: 'dog',
  name: '',
  breed: '',
  age: '',
  gender: 'male',
  size: 'medium',
  photo: '',
  bio: '',
  location: '',
  personality: [],
  interests: [],
  lookingFor: [],
};

export function useCreatePetForm(editingPet?: Pet | null, open?: boolean) {
  const [formState, setFormState] = useState<CreatePetFormState>(INITIAL_STATE);
  const [selectedTemplate, setSelectedTemplate] = useState<PetProfileTemplate | null>(null);

  const resetForm = useCallback(() => {
    setFormState(INITIAL_STATE);
    setSelectedTemplate(null);
  }, []);

  useEffect(() => {
    if (editingPet && open) {
      // Try to infer pet type from existing data, default to 'dog'
      const inferredType: PetType = 'dog'; // Could be enhanced to infer from breed/personality
      setFormState({
        currentStep: 'basics',
        petType: inferredType,
        name: editingPet.name,
        breed: editingPet.breed,
        age: editingPet.age.toString(),
        gender: editingPet.gender,
        size: editingPet.size,
        photo: editingPet.photo,
        bio: editingPet.bio,
        location: editingPet.location,
        personality: editingPet.personality,
        interests: editingPet.interests,
        lookingFor: editingPet.lookingFor,
      });
      setSelectedTemplate(null);
    } else if (open) {
      resetForm();
    }
  }, [editingPet, open, resetForm]);

  const actions = useCreateFormActions(setFormState, resetForm);
  const { handleNext, handleBack } = useStepNavigation(formState.currentStep, actions.setCurrentStep);
  const applyTemplate = useTemplateApplication(setSelectedTemplate, actions);

  const toggleArrayItem = (arr: string[], item: string, setter: (arr: string[]) => void) => {
    if (arr.includes(item)) {
      setter(arr.filter((i) => i !== item));
    } else {
      setter([...arr, item]);
    }
  };

  return {
    formState,
    selectedTemplate,
    actions,
    applyTemplate,
    toggleArrayItem,
    handleNext,
    handleBack,
  };
}

