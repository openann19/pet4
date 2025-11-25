import { lazy, Suspense } from 'react';
import { MotionView } from '@petspark/motion';
import { PhotoInputSection } from './PhotoInputSection';
import { BioInputSection } from './BioInputSection';
import type { CreatePetFormActions } from '../create-pet-types';

const PetPhotoAnalyzer = lazy(() =>
  import('@/components/PetPhotoAnalyzer').then((module) => ({ default: module.default }))
);

 
interface PhotoStepProps {
  name: string;
  photo: string;
  bio: string;
  breed: string;
  age: string;
  _size: 'small' | 'medium' | 'large' | 'extra-large';
  _personality: string[];
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  photoPresence: ReturnType<typeof import('@/effects/reanimated').useAnimatePresence>;
  actions: CreatePetFormActions;
}
 

export function PhotoStep({
  name,
  photo,
  bio,
  breed,
  age,
  _size: _sizeParam,
  _personality: _personalityParam,
  photoPresence,
  actions,
}: PhotoStepProps) {
  return (
    <MotionView key="photo" className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">Add a photo of {name || 'your pet'}</h3>
        <p className="text-muted-foreground">A great photo helps others connect with your companion</p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <PetPhotoAnalyzer
          onAnalysisComplete={(result) => {
            actions.setPhoto(result.photo);
            if (!breed) {
              actions.setBreed(result.breed);
            }
            if (!age) {
              actions.setAge(result.age.toString());
            }
            actions.setSize(result.size);
            actions.setPersonality(result.personality);
          }}
        />
      </Suspense>
      <PhotoInputSection photo={photo} photoPresence={photoPresence} actions={actions} />
      <BioInputSection name={name} bio={bio} actions={actions} />
    </MotionView>
  );
}
