import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreatePetFormActions } from '../create-pet-types';

interface BioInputSectionProps {
  name: string;
  bio: string;
  actions: CreatePetFormActions;
}

export function BioInputSection({ name, bio, actions }: BioInputSectionProps) {
  return (
    <div>
      <Label htmlFor="bio">Bio (optional)</Label>
      <Textarea
        id="bio"
        value={bio}
        onChange={(e) => {
          actions.setBio(e.target.value);
        }}
        placeholder={`Tell us what makes ${name || 'your pet'} special...`}
        rows={3}
        className="mt-1"
      />
    </div>
  );
}

