import type { CreatePetFormState, CreatePetFormActions } from './create-pet-types';
import type { PetProfileTemplate } from '@/lib/pet-profile-templates';
import type  from '@petspark/motion';
import {
  TypeStep,
  TemplateStep,
  BasicsStep,
  CharacteristicsStep,
  PhotoStep,
  PersonalityStep,
  PreferencesStep,
  CompleteStep,
} from './steps';

interface StepRendererProps {
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

export function renderTypeStep(props: StepRendererProps) {
  return (
    <TypeStep
      petType={props.formState.petType}
      stepStyle={props.stepStyle}
      petTypeIndicatorStyle={props.petTypeIndicatorStyle}
      petTypeButtonHover={props.petTypeButtonHover}
      petTypeButtonTap={props.petTypeButtonTap}
      actions={props.actions}
      onNext={props.onNext}
    />
  );
}

export function renderTemplateStep(props: StepRendererProps) {
  return (
    <TemplateStep
      petType={props.formState.petType}
      selectedTemplate={props.selectedTemplate}
      stepStyle={props.stepStyle}
      applyTemplate={props.applyTemplate}
      _actions={props.actions}
      onNext={props.onNext}
      onSkip={props.onSkip}
    />
  );
}

export function renderBasicsStep(props: StepRendererProps) {
  return (
    <BasicsStep
      petType={props.formState.petType}
      name={props.formState.name}
      breed={props.formState.breed}
      age={props.formState.age}
      actions={props.actions}
    />
  );
}

export function renderCharacteristicsStep(props: StepRendererProps) {
  return (
    <CharacteristicsStep
      name={props.formState.name}
      gender={props.formState.gender}
      size={props.formState.size}
      location={props.formState.location}
      actions={props.actions}
    />
  );
}

export function renderPhotoStep(props: StepRendererProps) {
  return (
    <PhotoStep
      name={props.formState.name}
      photo={props.formState.photo}
      bio={props.formState.bio}
      breed={props.formState.breed}
      age={props.formState.age}
      _size={props.formState.size}
      _personality={props.formState.personality}
      photoPresence={props.photoPresence}
      actions={props.actions}
    />
  );
}

export function renderPersonalityStep(props: StepRendererProps) {
  return (
    <PersonalityStep
      name={props.formState.name}
      petType={props.formState.petType}
      personality={props.formState.personality}
      toggleArrayItem={props.toggleArrayItem}
      actions={props.actions}
    />
  );
}

export function renderPreferencesStep(props: StepRendererProps) {
  return (
    <PreferencesStep
      name={props.formState.name}
      petType={props.formState.petType}
      interests={props.formState.interests}
      lookingFor={props.formState.lookingFor}
      toggleArrayItem={props.toggleArrayItem}
      actions={props.actions}
    />
  );
}

export function renderCompleteStep(props: StepRendererProps) {
  return (
    <CompleteStep
      name={props.formState.name}
      petType={props.formState.petType}
      breed={props.formState.breed}
      age={props.formState.age}
      personality={props.formState.personality}
    />
  );
}

