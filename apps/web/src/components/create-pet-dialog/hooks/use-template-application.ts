import type { PetProfileTemplate } from '@/lib/pet-profile-templates';
import type { CreatePetFormActions } from '../create-pet-types';

export function useTemplateApplication(
  setSelectedTemplate: (template: PetProfileTemplate | null) => void,
  actions: CreatePetFormActions
) {
  return (template: PetProfileTemplate) => {
    setSelectedTemplate(template);
    if (template.defaults.size) {
      actions.setSize(template.defaults.size);
    }
    if (template.defaults.breed) {
      actions.setBreed(template.defaults.breed);
    }
    if (template.defaults.bio) {
      actions.setBio(template.defaults.bio);
    }
    actions.setPersonality(template.defaults.personality);
    actions.setInterests(template.defaults.interests);
    actions.setLookingFor(template.defaults.lookingFor);
  };
}

