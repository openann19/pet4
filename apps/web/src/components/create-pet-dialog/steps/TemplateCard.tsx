import { Check } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { Badge } from '@/components/ui/badge';
import type { PetProfileTemplate } from '@/lib/pet-profile-templates';

interface TemplateCardProps {
  template: PetProfileTemplate;
  isSelected: boolean;
  _stepStyle: unknown;
  onClick: () => void;
}

export function TemplateCard({ template, isSelected, _stepStyle: _stepStyleParam, onClick }: TemplateCardProps) {
  return (
    <MotionView
      key={template.id}
      onClick={() => void onClick()}
      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 cursor-pointer ${
        isSelected
          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
          : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0">{template.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-base">{template.name}</h4>
            {isSelected && (
              <MotionView className="bg-primary text-primary-foreground rounded-full p-1 shrink-0">
                <Check size={14} weight="bold" />
              </MotionView>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {template.defaults.personality.slice(0, 3).map((trait) => (
              <Badge key={trait} variant="secondary" className="text-xs">
                {trait}
              </Badge>
            ))}
            {template.defaults.personality.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.defaults.personality.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </MotionView>
  );
}

