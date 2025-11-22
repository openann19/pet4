import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, Sparkle, CheckCircle, VideoCamera } from '@phosphor-icons/react';
import { useInteractionFeedback } from '@/hooks/useInteractionFeedback';
import { memo } from 'react';
import { FilterSectionLabel } from './FilterSectionLabel';
import { FilterSectionSubtext } from './FilterSectionSubtext';

interface MediaTabProps {
    readonly cropSize: 'any' | 'square' | 'portrait' | 'landscape'; readonly setCropSize: (v: 'any' | 'square' | 'portrait' | 'landscape') => void;
    readonly photoQuality: 'any' | 'high' | 'verified'; readonly setPhotoQuality: (v: 'any' | 'high' | 'verified') => void;
    readonly hasVideo: boolean | 'any'; readonly setHasVideo: (v: boolean) => void;
    readonly minPhotos: number; readonly setMinPhotos: (v: number) => void;
}

const CROP_OPTIONS = [
    { value: 'any', label: 'Any Size', icon: '📐' },
    { value: 'square', label: 'Square (1:1)', icon: '⬜' },
    { value: 'portrait', label: 'Portrait (3:4)', icon: '📱' },
    { value: 'landscape', label: 'Landscape (4:3)', icon: '🖼️' },
] as const;

const PHOTO_QUALITY = [
    { value: 'any', label: 'Any Quality', desc: 'Show all profiles' },
    { value: 'high', label: 'High Quality', desc: 'Clear, well-lit photos only' },
    { value: 'verified', label: 'Verified Photos', desc: 'Authenticated by moderators' },
] as const;

export const DiscoveryFiltersMediaTab = memo((props: MediaTabProps): JSX.Element => {
    const { cropSize, setCropSize, photoQuality, setPhotoQuality, hasVideo, setHasVideo, minPhotos, setMinPhotos } = props;
    const interaction = useInteractionFeedback();
    return (
        <ScrollArea className="h-full -mx-6 px-6">
            <div className="space-y-6 py-2">
                <div>
                    <FilterSectionLabel className="mb-4 flex items-center gap-2"><Camera size={18} weight="bold" />Photo Crop Size</FilterSectionLabel>
                    <FilterSectionSubtext className="mb-3">Filter profiles by photo aspect ratio</FilterSectionSubtext>
                    <div className="grid grid-cols-2 gap-2">
                        {CROP_OPTIONS.map(opt => (
                            <button key={opt.value} type="button" onClick={() => { interaction.press(); setCropSize(opt.value); }} className={`rounded-lg border-2 p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${cropSize === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                                <div className="mb-1 text-2xl">{opt.icon}</div>
                                <div className="text-sm font-medium">{opt.label}</div>
                            </button>
                        ))}
                    </div>
                </div>
                <Separator />
                <div>
                    <FilterSectionLabel className="mb-4 flex items-center gap-2"><Sparkle size={18} weight="bold" />Photo Quality</FilterSectionLabel>
                    <FilterSectionSubtext className="mb-3">Prefer high-quality or verified photos</FilterSectionSubtext>
                    <div className="flex flex-col gap-2">
                        {PHOTO_QUALITY.map(opt => (
                            <button key={opt.value} type="button" onClick={() => { interaction.press(); setPhotoQuality(opt.value); }} className={`rounded-lg border-2 p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${photoQuality === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                                <div className="flex items-center gap-2 text-sm font-medium">{photoQuality === opt.value && <CheckCircle size={16} weight="fill" className="text-primary" />}{opt.label}</div>
                                <FilterSectionSubtext className="mt-1" tone="muted">{opt.desc}</FilterSectionSubtext>
                            </button>
                        ))}
                    </div>
                </div>
                <Separator />
                <div>
                    <FilterSectionLabel className="mb-4 flex items-center gap-2"><VideoCamera size={18} weight="bold" />Video Content</FilterSectionLabel>
                    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                        <div>
                            <div className="text-sm font-medium">Has Video</div>
                            <FilterSectionSubtext className="mt-1" tone="muted">Only show profiles with video content</FilterSectionSubtext>
                        </div>
                        <Switch checked={hasVideo === true} onCheckedChange={(c) => { interaction.press(); setHasVideo(c); }} />
                    </div>
                </div>
                <Separator />
                <div>
                    <FilterSectionLabel className="mb-4 flex items-center gap-2"><Camera size={18} weight="bold" />Minimum Photos</FilterSectionLabel>
                    <FilterSectionSubtext className="mb-3">Profiles must have at least this many photos</FilterSectionSubtext>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-muted-foreground">Minimum</span><span className="font-medium">{minPhotos} photo{minPhotos !== 1 ? 's' : ''}</span></div>
                    <Slider value={[minPhotos]} onValueChange={(v) => setMinPhotos(v[0] ?? 0)} min={1} max={10} step={1} className="w-full" />
                </div>
            </div>
        </ScrollArea>
    );
});

DiscoveryFiltersMediaTab.displayName = 'DiscoveryFiltersMediaTab';
