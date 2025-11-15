import { FilterSectionLabel } from './FilterSectionLabel';
import { Slider } from '@/components/ui/slider';
import { memo } from 'react';

interface DistanceProps {
    readonly maxDistance: number;
    readonly setMaxDistance: (v: number) => void;
}

export const DiscoveryBasicDistance = memo(({ maxDistance, setMaxDistance }: DistanceProps): JSX.Element => (
    <div>
        <FilterSectionLabel className="mb-4">Maximum Distance</FilterSectionLabel>
        <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Within</span>
            <span className="font-medium">{maxDistance} miles</span>
        </div>
        <Slider value={[maxDistance]} onValueChange={(v) => setMaxDistance(v[0] ?? 0)} min={5} max={100} step={5} className="w-full" />
    </div>
));

DiscoveryBasicDistance.displayName = 'DiscoveryBasicDistance';
