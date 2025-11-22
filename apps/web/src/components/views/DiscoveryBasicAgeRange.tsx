import { FilterSectionLabel } from './FilterSectionLabel';
import { Slider } from '@/components/ui/slider';
import { memo } from 'react';

interface AgeRangeProps {
    readonly minAge: number;
    readonly maxAge: number;
    readonly setMinAge: (v: number) => void;
    readonly setMaxAge: (v: number) => void;
}

export const DiscoveryBasicAgeRange = memo(({ minAge, maxAge, setMinAge, setMaxAge }: AgeRangeProps): JSX.Element => {
    return (
        <div>
            <FilterSectionLabel className="mb-4">Age Range</FilterSectionLabel>
            <div className="space-y-4">
                <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Minimum Age</span>
                        <span className="font-medium">{minAge} {minAge === 0 ? 'year' : 'years'}</span>
                    </div>
                    <Slider value={[minAge]} onValueChange={(v) => setMinAge(v[0] ?? 0)} max={15} step={1} className="w-full" />
                </div>
                <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Maximum Age</span>
                        <span className="font-medium">{maxAge} years</span>
                    </div>
                    <Slider value={[maxAge]} onValueChange={(v) => setMaxAge(v[0] ?? 0)} max={15} step={1} className="w-full" />
                </div>
            </div>
        </div>
    );
});

DiscoveryBasicAgeRange.displayName = 'DiscoveryBasicAgeRange';
