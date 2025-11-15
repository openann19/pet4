import { Badge } from '@/components/ui/badge';
import { FilterSectionLabel } from './FilterSectionLabel';
import { FilterSectionSubtext } from './FilterSectionSubtext';
import { memo } from 'react';
import { X } from '@phosphor-icons/react';
import { ALL_LOOKING_FOR } from './discovery-constants';

interface LookingForProps {
    readonly lookingFor: readonly string[];
    readonly toggleLookingFor: (g: string) => void;
    readonly onPress: () => void;
}

export const DiscoveryBasicLookingFor = memo(({ lookingFor, toggleLookingFor, onPress }: LookingForProps): JSX.Element => (
    <div>
        <FilterSectionLabel className="mb-1">Looking For</FilterSectionLabel>
        {lookingFor.length > 0 && (
            <FilterSectionSubtext className="mb-1" tone="muted">
                ({lookingFor.length} selected)
            </FilterSectionSubtext>
        )}
        <FilterSectionSubtext className="mb-3">Find pets seeking these connections</FilterSectionSubtext>
        <div className="flex flex-wrap gap-2">
            {ALL_LOOKING_FOR.map((goal) => (
                <Badge
                    key={goal}
                    variant={lookingFor.includes(goal) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize transition-all hover:scale-105"
                    onClick={() => { onPress(); toggleLookingFor(goal); }}
                >
                    {goal}
                    {lookingFor.includes(goal) && <X size={14} className="ml-1" weight="bold" />}
                </Badge>
            ))}
        </div>
    </div>
));

DiscoveryBasicLookingFor.displayName = 'DiscoveryBasicLookingFor';
