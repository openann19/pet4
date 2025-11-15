import { Badge } from '@/components/ui/badge';
import { FilterSectionLabel } from './FilterSectionLabel';
import { memo } from 'react';
import { X } from '@phosphor-icons/react';
import { ALL_SIZES } from './discovery-constants';

interface SizePreferencesProps {
    readonly sizes: readonly string[];
    readonly toggleSize: (size: string) => void;
    readonly onPress: () => void;
}

export const DiscoveryBasicSizePreferences = memo(({ sizes, toggleSize, onPress }: SizePreferencesProps): JSX.Element => (
    <div>
        <FilterSectionLabel className="mb-3">Size Preferences</FilterSectionLabel>
        <div className="flex flex-wrap gap-2">
            {ALL_SIZES.map((size) => (
                <Badge
                    key={size}
                    variant={sizes.includes(size) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize transition-all hover:scale-105"
                    onClick={() => { onPress(); toggleSize(size); }}
                >
                    {size.replace('-', ' ')}
                    {sizes.includes(size) && <X size={14} className="ml-1" weight="bold" />}
                </Badge>
            ))}
        </div>
    </div>
));

DiscoveryBasicSizePreferences.displayName = 'DiscoveryBasicSizePreferences';
