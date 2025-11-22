import { Badge } from '@/components/ui/badge';
import { FilterSectionLabel } from './FilterSectionLabel';
import { FilterSectionSubtext } from './FilterSectionSubtext';
import { memo } from 'react';
import { X } from '@phosphor-icons/react';
import { ALL_PERSONALITIES } from './discovery-constants';

interface PersonalityProps {
    readonly personalities: readonly string[];
    readonly togglePersonality: (t: string) => void;
    readonly onPress: () => void;
}

export const DiscoveryBasicPersonality = memo(({ personalities, togglePersonality, onPress }: PersonalityProps): JSX.Element => (
    <div>
        <FilterSectionLabel className="mb-1">Personality Traits</FilterSectionLabel>
        {personalities.length > 0 && (
            <FilterSectionSubtext className="mb-1" tone="muted">
                ({personalities.length} selected)
            </FilterSectionSubtext>
        )}
        <FilterSectionSubtext className="mb-3">Find pets with these personality traits</FilterSectionSubtext>
        <div className="flex flex-wrap gap-2">
            {ALL_PERSONALITIES.map((trait) => (
                <Badge
                    key={trait}
                    variant={personalities.includes(trait) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize transition-all hover:scale-105"
                    onClick={() => { onPress(); togglePersonality(trait); }}
                >
                    {trait}
                    {personalities.includes(trait) && <X size={14} className="ml-1" weight="bold" />}
                </Badge>
            ))}
        </div>
    </div>
));

DiscoveryBasicPersonality.displayName = 'DiscoveryBasicPersonality';
