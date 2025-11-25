import { Check } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import type { AnimatedStyle } from '@petspark/motion';
import { PET_TYPES } from '../create-pet-constants';
import type { CreatePetFormActions } from '../create-pet-types';

 
interface TypeStepProps {
  petType: string;
  stepStyle: AnimatedStyle;
  petTypeIndicatorStyle: AnimatedStyle;
  petTypeButtonHover: ReturnType<typeof import('@/effects/reanimated/use-hover-lift').useHoverLift>;
  petTypeButtonTap: ReturnType<typeof import('@/effects/reanimated/use-bounce-on-tap').useBounceOnTap>;
  actions: CreatePetFormActions;
  onNext: () => void;
}
 

export function TypeStep({
  petType,
  stepStyle,
  petTypeIndicatorStyle,
  petTypeButtonHover,
  petTypeButtonTap,
  actions,
  onNext,
}: TypeStepProps) {
  return (
    <MotionView key="type" style={stepStyle} className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">What type of pet do you have?</h3>
        <p className="text-muted-foreground">Choose the option that best describes your companion</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {PET_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <MotionView
              key={type.value}
              onClick={() => {
                petTypeButtonTap.handlePress();
                actions.setPetType(type.value);
                setTimeout(() => {
                  onNext();
                }, 400);
              }}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${petType === type.value
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
                }`}
              onMouseEnter={petTypeButtonHover.handleEnter}
              onMouseLeave={petTypeButtonHover.handleLeave}
            >
              <MotionView>
                <div className="flex flex-col items-center gap-3">
                  <span className="text-4xl">{type.emoji}</span>
                  <Icon size={32} weight="duotone" className="text-primary" />
                  <span className="font-semibold text-lg">{type.label}</span>
                </div>
              </MotionView>
              {petType === type.value && (
                <MotionView
                  style={petTypeIndicatorStyle}
                  className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1"
                >
                  <Check size={16} weight="bold" />
                </MotionView>
              )}
            </MotionView>
          );
        })}
      </div>
    </MotionView>
  );
}
