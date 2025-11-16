/**
 * Verification Level Selector
 *
 * Basic/Premium/VIP verification level selector
 */

'use client';

import { Check } from 'lucide-react';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import type { VerificationLevel } from './VerificationDialog';

export interface VerificationLevelSelectorProps {
  selectedLevel: VerificationLevel;
  onLevelChange: (level: VerificationLevel) => void;
  className?: string;
}

const LEVELS: {
  id: VerificationLevel;
  name: string;
  description: string;
  features: string[];
}[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Photo ID verification',
    features: ['Photo ID required'],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Photo ID + Address verification',
    features: ['Photo ID', 'Proof of address'],
  },
  {
    id: 'vip',
    name: 'VIP',
    description: 'Full identity verification',
    features: ['Photo ID', 'Proof of address', 'Additional documents'],
  },
];

export function VerificationLevelSelector({
  selectedLevel,
  onLevelChange,
  className,
}: VerificationLevelSelectorProps): React.JSX.Element {
  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <h3 className={cn(getTypographyClasses('h3'), 'mb-2')}>Verification Level</h3>
        <p className={cn(getTypographyClasses('bodyMuted'), 'text-sm')}>
          Choose your verification level
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            onClick={() => onLevelChange(level.id)}
            className={cn(
              'relative p-4 rounded-lg border-2 transition-all',
              selectedLevel === level.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            )}
          >
            {selectedLevel === level.id && (
              <div className="absolute top-2 right-2">
                <Check className="size-5 text-primary" />
              </div>
            )}

            <div className="space-y-2">
              <h4 className={cn(getTypographyClasses('h3'), 'font-semibold')}>
                {level.name}
              </h4>
              <p className={cn(getTypographyClasses('bodyMuted'), 'text-sm')}>
                {level.description}
              </p>
              <ul className="space-y-1 mt-3">
                {level.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

