import { X } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { Badge } from '@/components/ui/badge';
import { PERSONALITY_TRAITS } from '../create-pet-constants';
import type { PetType } from '@/lib/pet-profile-templates';
import type { CreatePetFormActions } from '../create-pet-types';

interface PersonalityStepProps {
  name: string;
  petType: PetType;
  personality: string[];
  toggleArrayItem: (arr: string[], item: string, setter: (arr: string[]) => void) => void;
  actions: CreatePetFormActions;
}

export function PersonalityStep({
  name,
  petType,
  personality,
  toggleArrayItem,
  actions,
}: PersonalityStepProps) {
  return (
    <MotionView key="personality" className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">What's {name || 'your pet'}'s personality?</h3>
        <p className="text-muted-foreground">Select all traits that apply</p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {PERSONALITY_TRAITS[petType].map((trait) => (
          <Badge
            key={trait}
            variant={personality.includes(trait) ? 'default' : 'outline'}
            className="cursor-pointer px-4 py-2 text-base"
            onClick={() => {
              toggleArrayItem(personality, trait, actions.setPersonality);
            }}
          >
            {trait}
            {personality.includes(trait) && (
              <span>
                <X size={14} className="ml-2" weight="bold" />
              </span>
            )}
          </Badge>
        ))}
      </div>
    </MotionView>
  );
}

