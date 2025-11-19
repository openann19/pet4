import {
  useCreatePetForm,
  useCreatePetAnimations
  useCreatePetValidation,
  useCreatePetSubmission
} from './hooks';
import { renderStepContent } from './render-step-content';
import type { CreatePetDialogProps } from './create-pet-types';

export function useCreatePetDialog({ open, onOpenChange, editingPet }: CreatePetDialogProps) {
  const {
    formState,
    selectedTemplate,
    actions,
    applyTemplate,
    toggleArrayItem,
    handleNext,
    handleBack,
  } = useCreatePetForm(editingPet, open);

  const {
    emojiStyle,
    stepStyle,
    progressStyle,
    petTypeButtonHover,
    petTypeButtonTap,
    petTypeIndicatorStyle,
    photoPresence,
    completeStepPresence,
  } = useCreatePetAnimations(formState.currentStep, formState.photo);

  const { canProceed } = useCreatePetValidation(formState);

  const { handleSubmit } = useCreatePetSubmission(formState, editingPet, () => {
    onOpenChange(false);
    actions.resetForm();
  });

  const skipToBasics = () => {
    actions.setCurrentStep('basics');
  };

  const stepContent = renderStepContent({
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
    onNext: handleNext,
    onSkip: skipToBasics,
  });

  return {
    formState,
    emojiStyle,
    progressStyle,
    completeStepPresence,
    stepContent,
    canProceed,
    handleBack,
    handleNext,
    handleSubmit,
    editingPet,
  };
}

