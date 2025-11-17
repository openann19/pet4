import { Sparkle } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { getTemplatesByType, type PetType, type PetProfileTemplate } from '@/lib/pet-profile-templates';
import type { AnimatedStyle } from '@petspark/motion';
import type { CreatePetFormActions } from '../create-pet-types';
import { TemplateCard } from './TemplateCard';

interface TemplateStepProps {
  petType: PetType;
  selectedTemplate: PetProfileTemplate | null;
  stepStyle: AnimatedStyle;
  applyTemplate: (template: PetProfileTemplate) => void;
  _actions: CreatePetFormActions;
  onNext: () => void;
  onSkip: () => void;
}

export function TemplateStep({
  petType,
  selectedTemplate,
  stepStyle,
  applyTemplate,
  _actions: _actionsParam,
  onNext,
  onSkip,
}: TemplateStepProps) {
  const templates = getTemplatesByType(petType);

  return (
    <MotionView key="template" style={stepStyle} className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">Choose a profile template</h3>
        <p className="text-muted-foreground">
          Pre-fill your pet's profile with common traits, or skip to customize everything
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-100 overflow-y-auto pr-2">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate?.id === template.id}
            _stepStyle={stepStyle}
            onClick={() => {
              applyTemplate(template);
              setTimeout(() => {
                onNext();
              }, 300);
            }}
          />
        ))}
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={onSkip}>
        <Sparkle size={16} className="mr-2" />
        Skip & Customize From Scratch
      </Button>
    </MotionView>
  );
}

