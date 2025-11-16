import type { Pet } from '@/lib/types';
import type { PetType } from '@/lib/pet-profile-templates';

export type Step =
  | 'type'
  | 'template'
  | 'basics'
  | 'characteristics'
  | 'personality'
  | 'preferences'
  | 'photo'
  | 'complete';

export interface CreatePetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPet?: Pet | null;
}

export interface CreatePetFormState {
  currentStep: Step;
  petType: PetType;
  name: string;
  breed: string;
  age: string;
  gender: 'male' | 'female';
  size: 'small' | 'medium' | 'large' | 'extra-large';
  photo: string;
  bio: string;
  location: string;
  personality: string[];
  interests: string[];
  lookingFor: string[];
}

export interface CreatePetFormActions {
  setCurrentStep: (step: Step) => void;
  setPetType: (type: PetType) => void;
  setName: (name: string) => void;
  setBreed: (breed: string) => void;
  setAge: (age: string) => void;
  setGender: (gender: 'male' | 'female') => void;
  setSize: (size: 'small' | 'medium' | 'large' | 'extra-large') => void;
  setPhoto: (photo: string) => void;
  setBio: (bio: string) => void;
  setLocation: (location: string) => void;
  setPersonality: (personality: string[]) => void;
  setInterests: (interests: string[]) => void;
  setLookingFor: (lookingFor: string[]) => void;
  resetForm: () => void;
}

