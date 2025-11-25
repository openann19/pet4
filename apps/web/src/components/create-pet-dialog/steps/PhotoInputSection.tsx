import { MotionView } from '@petspark/motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProgressiveImage } from '@/components/enhanced/ProgressiveImage';
import type { CreatePetFormActions } from '../create-pet-types';

 
interface PhotoInputSectionProps {
  photo: string;
  photoPresence: ReturnType<typeof import('@/effects/reanimated').useAnimatePresence>;
  actions: CreatePetFormActions;
}
 

export function PhotoInputSection({ photo, photoPresence, actions }: PhotoInputSectionProps) {
  return (
    <div>
      <Label htmlFor="photo">Photo URL *</Label>
      <Input
        id="photo"
        value={photo}
        onChange={(e) => {
          actions.setPhoto(e.target.value);
        }}
        placeholder="https://images.unsplash.com/photo-..."
        className="mt-1"
      />
      {photoPresence.shouldRender && photo && (
        <MotionView
          style={photoPresence.animatedStyle}
          className="mt-4 relative h-64 rounded-xl overflow-hidden bg-muted shadow-lg"
        >
          <ProgressiveImage
            src={photo}
            alt="Preview"
            className="w-full h-full object-cover"
            aria-label="Pet photo preview"
          />
        </MotionView>
      )}
    </div>
  );
}
