import { MotionView } from '@petspark/motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DialogHeaderSection } from './DialogHeaderSection';
import { DialogFooterSection } from './DialogFooterSection';
import { useCreatePetDialog } from './use-create-pet-dialog';
import type { CreatePetDialogProps } from './create-pet-types';

export default function CreatePetDialog(props: CreatePetDialogProps) {
  const {
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
  } = useCreatePetDialog(props);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeaderSection emojiStyle={emojiStyle} editingPet={editingPet} />

        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-6">
          <MotionView
            className="h-full bg-linear-to-r from-primary to-accent"
            style={progressStyle}
          />
        </div>

        {formState.currentStep !== 'complete' ? (
          completeStepPresence.shouldRender && (
            <MotionView style={completeStepPresence.animatedStyle}>
              {stepContent}
            </MotionView>
          )
        ) : (
          stepContent
        )}

        <DialogFooterSection
          currentStep={formState.currentStep}
          canProceed={canProceed}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={() => void handleSubmit()}
          editingPet={editingPet}
        />
      </DialogContent>
    </Dialog>
  );
}

