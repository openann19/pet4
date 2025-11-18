import { ArrowLeft, ArrowRight, Check } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import type { Step } from './create-pet-types';

interface DialogFooterSectionProps {
  currentStep: Step;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  editingPet?: { id: string } | null;
}

export function DialogFooterSection({
  currentStep,
  canProceed,
  onBack,
  onNext,
  onSubmit,
  editingPet,
}: DialogFooterSectionProps) {
  return (
    <div className="flex gap-3 pt-6 mt-6 border-t">
      {currentStep !== 'type' && currentStep !== 'complete' && (
        <MotionView>
          <Button type="button" variant="outline" onClick={() => void onBack()} className="gap-2">
            <ArrowLeft size={16} weight="bold" />
            Back
          </Button>
        </MotionView>
      )}
      <div className="flex-1" />
      {currentStep !== 'complete' ? (
        <MotionView>
          <Button
            type="button"
            onClick={() => void onNext()}
            disabled={!canProceed}
            className="gap-2 bg-linear-to-r from-primary to-accent"
          >
            Continue
            <ArrowRight size={16} weight="bold" />
          </Button>
        </MotionView>
      ) : (
        <MotionView>
          <Button
            type="button"
            onClick={() => void onSubmit()}
            className="gap-2 bg-linear-to-r from-primary to-accent"
          >
            <Check size={16} weight="bold" />
            {editingPet ? 'Save Changes' : 'Create Profile'}
          </Button>
        </MotionView>
      )}
    </div>
  );
}

