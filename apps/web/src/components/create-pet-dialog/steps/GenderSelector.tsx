import { MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Label';

interface GenderSelectorProps {
  gender: 'male' | 'female';
  onSelect: (gender: 'male' | 'female') => void;
}

export function GenderSelector({ gender, onSelect }: GenderSelectorProps) {
  return (
    <div>
      <Label className="mb-3 block">Gender *</Label>
      <div className="grid grid-cols-2 gap-4">
        <MotionView>
          <Button
            type="button"
            variant={gender === 'male' ? 'default' : 'outline'}
            className="w-full h-16 text-lg"
            onClick={() => {
              onSelect('male');
            }}
          >
            ♂ Male
          </Button>
        </MotionView>
        <MotionView>
          <Button
            type="button"
            variant={gender === 'female' ? 'default' : 'outline'}
            className="w-full h-16 text-lg"
            onClick={() => {
              onSelect('female');
            }}
          >
            ♀ Female
          </Button>
        </MotionView>
      </div>
    </div>
  );
}

