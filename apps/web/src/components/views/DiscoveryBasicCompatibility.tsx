import { FilterSectionLabel } from './FilterSectionLabel';
import { FilterSectionSubtext } from './FilterSectionSubtext';
import { Slider } from '@/components/ui/slider';
import { memo } from 'react';

interface CompatibilityProps {
    readonly minCompatibility: number;
    readonly setMinCompatibility: (v: number) => void;
}

export const DiscoveryBasicCompatibility = memo(({ minCompatibility, setMinCompatibility }: CompatibilityProps): JSX.Element => (
    <div>
        <FilterSectionLabel className="mb-4">Minimum Compatibility Score</FilterSectionLabel>
        <FilterSectionSubtext className="mb-3">Only show pets with at least this compatibility</FilterSectionSubtext>
        <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Minimum Score</span>
            <span className="font-medium">{minCompatibility}%</span>
        </div>
        <Slider value={[minCompatibility]} onValueChange={(v) => setMinCompatibility(v[0] ?? 0)} min={0} max={90} step={10} className="w-full" />
    </div>
));

DiscoveryBasicCompatibility.displayName = 'DiscoveryBasicCompatibility';
