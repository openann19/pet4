import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { memo } from 'react';
import { useInteractionFeedback } from '@/hooks/useInteractionFeedback';
import { DiscoveryBasicAgeRange } from './DiscoveryBasicAgeRange';
import { DiscoveryBasicSizePreferences } from './DiscoveryBasicSizePreferences';
import { DiscoveryBasicDistance } from './DiscoveryBasicDistance';
import { DiscoveryBasicPersonality } from './DiscoveryBasicPersonality';
import { DiscoveryBasicInterests } from './DiscoveryBasicInterests';
import { DiscoveryBasicLookingFor } from './DiscoveryBasicLookingFor';
import { DiscoveryBasicCompatibility } from './DiscoveryBasicCompatibility';

interface BasicTabProps {
    readonly minAge: number; readonly maxAge: number; readonly setMinAge: (v: number) => void; readonly setMaxAge: (v: number) => void;
    readonly sizes: readonly string[]; readonly toggleSize: (s: string) => void;
    readonly maxDistance: number; readonly setMaxDistance: (v: number) => void;
    readonly personalities: readonly string[]; readonly togglePersonality: (t: string) => void;
    readonly interests: readonly string[]; readonly toggleInterest: (i: string) => void;
    readonly lookingFor: readonly string[]; readonly toggleLookingFor: (g: string) => void;
    readonly minCompatibility: number; readonly setMinCompatibility: (v: number) => void;
}

export const DiscoveryFiltersBasicTab = memo((props: BasicTabProps): JSX.Element => {
    const interaction = useInteractionFeedback();
    const { minAge, maxAge, setMinAge, setMaxAge, sizes, toggleSize, maxDistance, setMaxDistance, personalities, togglePersonality, interests, toggleInterest, lookingFor, toggleLookingFor, minCompatibility, setMinCompatibility } = props;
    const onPress = interaction.press;
    return (
        <ScrollArea className="h-full -mx-6 px-6">
            <div className="space-y-6 py-2">
                <DiscoveryBasicAgeRange minAge={minAge} maxAge={maxAge} setMinAge={setMinAge} setMaxAge={setMaxAge} />
                <Separator />
                <DiscoveryBasicSizePreferences sizes={sizes} toggleSize={toggleSize} onPress={onPress} />
                <Separator />
                <DiscoveryBasicDistance maxDistance={maxDistance} setMaxDistance={setMaxDistance} />
                <Separator />
                <DiscoveryBasicPersonality personalities={personalities} togglePersonality={togglePersonality} onPress={onPress} />
                <Separator />
                <DiscoveryBasicInterests interests={interests} toggleInterest={toggleInterest} onPress={onPress} />
                <Separator />
                <DiscoveryBasicLookingFor lookingFor={lookingFor} toggleLookingFor={toggleLookingFor} onPress={onPress} />
                <Separator />
                <DiscoveryBasicCompatibility minCompatibility={minCompatibility} setMinCompatibility={setMinCompatibility} />
            </div>
        </ScrollArea>
    );
});

DiscoveryFiltersBasicTab.displayName = 'DiscoveryFiltersBasicTab';
