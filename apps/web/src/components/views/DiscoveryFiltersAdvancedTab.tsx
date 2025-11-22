import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightning, CheckCircle, Clock, Sparkle } from '@phosphor-icons/react';
import { memo } from 'react';
import { useInteractionFeedback } from '@/hooks/useInteractionFeedback';
import { FilterSectionLabel } from './FilterSectionLabel';
import { FilterSectionSubtext } from './FilterSectionSubtext';

interface AdvancedTabProps {
    readonly verified: boolean; readonly setVerified: (v: boolean) => void;
    readonly activeToday: boolean; readonly setActiveToday: (v: boolean) => void;
    readonly hasStories: boolean; readonly setHasStories: (v: boolean) => void;
    readonly respondQuickly: boolean; readonly setRespondQuickly: (v: boolean) => void;
    readonly superLikesOnly: boolean; readonly setSuperLikesOnly: (v: boolean) => void;
}

export const DiscoveryFiltersAdvancedTab = memo((props: AdvancedTabProps): JSX.Element => {
    const { verified, setVerified, activeToday, setActiveToday, hasStories, setHasStories, respondQuickly, setRespondQuickly, superLikesOnly, setSuperLikesOnly } = props;
    const interaction = useInteractionFeedback();
    return (
        <ScrollArea className="h-full -mx-6 px-6">
            <div className="space-y-4 py-2">
                <div>
                    <FilterSectionLabel className="mb-4 flex items-center gap-2"><Lightning size={18} weight="bold" />Enhanced Filters</FilterSectionLabel>
                    <FilterSectionSubtext className="mb-4">Find the most active and responsive matches</FilterSectionSubtext>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                            <div className="flex items-center gap-3"><CheckCircle size={20} weight="duotone" className="text-primary" /><div><div className="text-sm font-medium">Verified Profiles</div><FilterSectionSubtext className="mt-0.5" tone="muted">ID or photo verified accounts</FilterSectionSubtext></div></div>
                            <Switch checked={verified} onCheckedChange={(c) => { interaction.press(); setVerified(c); }} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                            <div className="flex items-center gap-3"><Clock size={20} weight="duotone" className="text-secondary" /><div><div className="text-sm font-medium">Active Today</div><FilterSectionSubtext className="mt-0.5" tone="muted">Recently active profiles</FilterSectionSubtext></div></div>
                            <Switch checked={activeToday} onCheckedChange={(c) => { interaction.press(); setActiveToday(c); }} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                            <div className="flex items-center gap-3"><Sparkle size={20} weight="duotone" className="text-foreground" /><div><div className="text-sm font-medium">Has Stories</div><FilterSectionSubtext className="mt-0.5" tone="muted">Profiles with recent story posts</FilterSectionSubtext></div></div>
                            <Switch checked={hasStories} onCheckedChange={(c) => { interaction.press(); setHasStories(c); }} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                            <div className="flex items-center gap-3"><Lightning size={20} weight="duotone" className="text-destructive" /><div><div className="text-sm font-medium">Respond Quickly</div><FilterSectionSubtext className="mt-0.5" tone="muted">Pets with fast response patterns</FilterSectionSubtext></div></div>
                            <Switch checked={respondQuickly} onCheckedChange={(c) => { interaction.press(); setRespondQuickly(c); }} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5">
                            <div className="flex items-center gap-3"><Lightning size={20} weight="duotone" className="text-accent" /><div><div className="text-sm font-medium">Super Likes Only</div><FilterSectionSubtext className="mt-0.5" tone="muted">Show only profiles that super liked you</FilterSectionSubtext></div></div>
                            <Switch checked={superLikesOnly} onCheckedChange={(c) => { interaction.press(); setSuperLikesOnly(c); }} />
                        </div>
                    </div>
                </div>
                <Separator />
                <div className="rounded-lg border border-accent/20 bg-accent/10 p-4">
                    <div className="flex items-start gap-3"><Sparkle size={20} weight="duotone" className="mt-0.5 shrink-0 text-accent" /><div><div className="mb-1 text-sm font-medium">Premium Filters Active</div><FilterSectionSubtext tone="muted">Advanced filters help you find the most compatible and active matches. Some filters may reduce the number of available profiles.</FilterSectionSubtext></div></div>
                </div>
            </div>
        </ScrollArea>
    );
});

DiscoveryFiltersAdvancedTab.displayName = 'DiscoveryFiltersAdvancedTab';
