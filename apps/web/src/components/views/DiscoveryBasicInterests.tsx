import { Badge } from '@/components/ui/badge';
import { FilterSectionLabel } from './FilterSectionLabel';
import { FilterSectionSubtext } from './FilterSectionSubtext';
import { memo } from 'react';
import { X } from '@phosphor-icons/react';
import { ALL_INTERESTS } from './discovery-constants';

interface InterestsProps {
    readonly interests: readonly string[];
    readonly toggleInterest: (i: string) => void;
    readonly onPress: () => void;
}

export const DiscoveryBasicInterests = memo(({ interests, toggleInterest, onPress }: InterestsProps): JSX.Element => (
    <div>
        <FilterSectionLabel className="mb-1">Interests</FilterSectionLabel>
        {interests.length > 0 && (
            <FilterSectionSubtext className="mb-1" tone="muted">
                ({interests.length} selected)
            </FilterSectionSubtext>
        )}
        <FilterSectionSubtext className="mb-3">Find pets who enjoy these activities</FilterSectionSubtext>
        <div className="flex flex-wrap gap-2">
            {ALL_INTERESTS.map((interest) => (
                <Badge
                    key={interest}
                    variant={interests.includes(interest) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize transition-all hover:scale-105"
                    onClick={() => { onPress(); toggleInterest(interest); }}
                >
                    {interest}
                    {interests.includes(interest) && <X size={14} className="ml-1" weight="bold" />}
                </Badge>
            ))}
        </div>
    </div>
));

DiscoveryBasicInterests.displayName = 'DiscoveryBasicInterests';
