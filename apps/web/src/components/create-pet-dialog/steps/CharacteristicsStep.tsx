import { MotionView } from '@petspark/motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GenderSelector } from './GenderSelector';
import { SizeSelector } from './SizeSelector';
import type { CreatePetFormActions } from '../create-pet-types';

interface CharacteristicsStepProps {
  name: string;
  gender: 'male' | 'female';
  size: 'small' | 'medium' | 'large' | 'extra-large';
  location: string;
  actions: CreatePetFormActions;
}

export function CharacteristicsStep({
  name,
  gender,
  size,
  location,
  actions,
}: CharacteristicsStepProps) {
  return (
    <MotionView key="characteristics" className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">Physical characteristics</h3>
        <p className="text-muted-foreground">Help others know more about {name || 'your pet'}</p>
      </div>
      <div className="space-y-6">
        <GenderSelector
          gender={gender}
          onSelect={(g) => {
            actions.setGender(g);
          }}
        />
        <SizeSelector
          size={size}
          onSelect={(s) => {
            actions.setSize(s);
          }}
        />
        <div>
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => {
              actions.setLocation(e.target.value);
            }}
            placeholder="e.g., San Francisco, CA"
            className="mt-1"
          />
        </div>
      </div>
    </MotionView>
  );
}

