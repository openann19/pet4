
import type { CreatePetFormState, CreatePetFormActions } from './create-pet-types';
import type { PetProfileTemplate } from '@/lib/pet-profile-templates';
import {
  renderTypeStep,
  renderTemplateStep,
  renderBasicsStep,
  renderCharacteristicsStep,
  renderPhotoStep,
  renderPersonalityStep,
  renderPreferencesStep,
  renderCompleteStep,
} from './render-step-content-helpers';

interface RenderStepContentProps {
  formState: CreatePetFormState;
  selectedTemplate: PetProfileTemplate | null;
  stepStyle: AnimatedStyle;
  petTypeIndicatorStyle: AnimatedStyle;
  petTypeButtonHover: ReturnType<typeof import('@/effects/reanimated/use-hover-lift').useHoverLift>;
  petTypeButtonTap: ReturnType<typeof import('@/effects/reanimated/use-bounce-on-tap').useBounceOnTap>;
  photoPresence: ReturnType<typeof import('@/effects/reanimated').useAnimatePresence>;
  actions: CreatePetFormActions;
  applyTemplate: (template: PetProfileTemplate) => void;
  toggleArrayItem: (arr: string[], item: string, setter: (arr: string[]) => void) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function renderStepContent({
  formState,
  selectedTemplate,
  stepStyle,
  petTypeIndicatorStyle,
  petTypeButtonHover,
  petTypeButtonTap,
  photoPresence,
  actions,
  applyTemplate,
  toggleArrayItem,
  onNext,
  onSkip,
}: RenderStepContentProps) {
  const props = {
    formState,
    selectedTemplate,
    stepStyle,
    petTypeIndicatorStyle,
    petTypeButtonHover,
    petTypeButtonTap,
    photoPresence,
    actions,
    applyTemplate,
    toggleArrayItem,
    onNext,
    onSkip,
  };

  switch (formState.currentStep) {
    case 'type':
      return renderTypeStep(props);
    case 'template':
      return renderTemplateStep(props);
    case 'basics':
      return renderBasicsStep(props);
    case 'characteristics':
      return renderCharacteristicsStep(props);
    case 'photo':
      return renderPhotoStep(props);
    case 'personality':
      return renderPersonalityStep(props);
    case 'preferences':
      return renderPreferencesStep(props);
    case 'complete':
      return renderCompleteStep(props);
    default:
      return null;
  }
}

