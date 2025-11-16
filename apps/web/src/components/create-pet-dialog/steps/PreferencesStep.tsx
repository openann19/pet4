import { X } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { INTERESTS, LOOKING_FOR } from '../create-pet-constants';
import type { PetType } from '@/lib/pet-profile-templates';
import type { CreatePetFormActions } from '../create-pet-types';

interface PreferencesStepProps {
  name: string;
  petType: PetType;
  interests: string[];
  lookingFor: string[];
  toggleArrayItem: (arr: string[], item: string, setter: (arr: string[]) => void) => void;
  actions: CreatePetFormActions;
}

export function PreferencesStep({
  name,
  petType,
  interests,
  lookingFor,
  toggleArrayItem,
  actions,
}: PreferencesStepProps) {
  return (
    <MotionView key="preferences" className="space-y-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">What does {name || 'your pet'} enjoy?</h3>
        <p className="text-muted-foreground">This helps us find perfect companions</p>
      </div>
      <div className="space-y-6">
        <div>
          <Label className="text-lg mb-3 block">Interests</Label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS[petType].map((interest) => (
              <Badge
                key={interest}
                variant={interests.includes(interest) ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => {
                  toggleArrayItem(interests, interest, actions.setInterests);
                }}
              >
                {interest}
                {interests.includes(interest) && (
                  <X size={12} className="ml-1.5" weight="bold" />
                )}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-lg mb-3 block">Looking For</Label>
          <div className="flex flex-wrap gap-2">
            {LOOKING_FOR[petType].map((item) => (
              <Badge
                key={item}
                variant={lookingFor.includes(item) ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => {
                  toggleArrayItem(lookingFor, item, actions.setLookingFor);
                }}
              >
                {item}
                {lookingFor.includes(item) && (
                  <X size={12} className="ml-1.5" weight="bold" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </MotionView>
  );
}

