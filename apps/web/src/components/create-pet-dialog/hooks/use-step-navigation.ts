import { useCallback } from 'react';
import type { Step } from '../create-pet-types';

const STEPS: Step[] = [
  'type',
  'template',
  'basics',
  'characteristics',
  'photo',
  'personality',
  'preferences',
  'complete',
];

export function useStepNavigation(
  currentStep: Step,
  setCurrentStep: (step: Step) => void
) {
  const handleNext = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex >= 0 && currentIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }
  }, [currentStep, setCurrentStep]);

  const handleBack = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = STEPS[currentIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep);
      }
    }
  }, [currentStep, setCurrentStep]);

  return { handleNext, handleBack };
}

