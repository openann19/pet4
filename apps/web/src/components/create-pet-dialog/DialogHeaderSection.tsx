import { MotionView   type AnimatedStyle,
} from '@petspark/motion';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';


interface DialogHeaderSectionProps {
  emojiStyle: AnimatedStyle;
  editingPet?: { id: string } | null;
}

export function DialogHeaderSection({ emojiStyle, editingPet }: DialogHeaderSectionProps) {
  return (
    <DialogHeader>
      <DialogTitle className="text-xl flex items-center gap-2">
        <MotionView style={emojiStyle}>🐾</MotionView>
        {editingPet ? 'Edit Pet Profile' : 'Create Pet Profile'}
      </DialogTitle>
      <DialogDescription>
        {editingPet
          ? 'Update your pet\'s profile information'
          : 'Fill out the form to create a new pet profile'}
      </DialogDescription>
    </DialogHeader>
  );
}

