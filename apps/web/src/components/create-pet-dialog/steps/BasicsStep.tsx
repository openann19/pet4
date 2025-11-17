import { MotionView } from '@petspark/motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PET_TYPES } from '../create-pet-constants';
import type { PetType } from '@/lib/pet-profile-templates';
import type { CreatePetFormActions } from '../create-pet-types';

interface BasicsStepProps {
  petType: PetType;
  name: string;
  breed: string;
  age: string;
  actions: CreatePetFormActions;
}

const PLACEHOLDER_NAMES: Record<PetType, string> = {
  dog: 'Max',
  cat: 'Whiskers',
  bird: 'Charlie',
  rabbit: 'Fluffy',
  fish: 'Bubbles',
  other: 'Buddy',
};

const PLACEHOLDER_BREEDS: Record<PetType, string> = {
  dog: 'Golden Retriever',
  cat: 'Maine Coon',
  bird: 'Parakeet',
  rabbit: 'Holland Lop',
  fish: 'Betta',
  other: 'Mixed',
};

export function BasicsStep({ petType, name, breed, age, actions }: BasicsStepProps) {
  const petTypeLabel = PET_TYPES.find((t) => t.value === petType)?.label.toLowerCase() ?? 'pet';

  return (
    <MotionView key="basics" className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">Tell us the basics</h3>
        <p className="text-muted-foreground">What's your {petTypeLabel}'s name, breed, and age?</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              actions.setName(e.target.value);
            }}
            placeholder={`e.g., ${PLACEHOLDER_NAMES[petType]}`}
            className="mt-1"
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="breed">Breed / Species *</Label>
          <Input
            id="breed"
            value={breed}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              actions.setBreed(e.target.value);
            }}
            placeholder={`e.g., ${PLACEHOLDER_BREEDS[petType]}`}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="age">Age (in years) *</Label>
          <Input
            id="age"
            type="number"
            min="0"
            max="30"
            value={age}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              actions.setAge(e.target.value);
            }}
            placeholder="3"
            className="mt-1"
          />
        </div>
      </div>
    </MotionView>
  );
}

