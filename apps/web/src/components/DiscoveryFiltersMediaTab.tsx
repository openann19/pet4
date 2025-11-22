'use client';

import React from 'react';
import { Camera, Sparkle, VideoCamera, CheckCircle } from '@phosphor-icons/react';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getTypographyClasses, type TypographyVariantInput } from '@/lib/typography';

import {
    type CropSize,
    type DiscoveryPreferences,
    type PhotoQuality,
} from '@/components/discovery-preferences';

interface MediaTabProps {
    draft: DiscoveryPreferences;
    onDraftChange(this: void, next: DiscoveryPreferences): void;
}

export function DiscoveryFiltersMediaTab({ draft, onDraftChange }: MediaTabProps) {
    const { mediaFilters } = draft;

    const setMediaFilters = (patch: Partial<DiscoveryPreferences['mediaFilters']>) => {
        onDraftChange({
            ...draft,
            mediaFilters: {
                ...draft.mediaFilters,
                ...patch,
            },
        });
    };

    const handleCropSizeChange = (value: CropSize) => {
        setMediaFilters({ cropSize: value });
    };

    const handlePhotoQualityChange = (value: PhotoQuality) => {
        setMediaFilters({ photoQuality: value });
    };

    const handleHasVideoChange = (checked: boolean) => {
        setMediaFilters({ hasVideo: checked ? true : 'any' });
    };

    const handleMinPhotosChange = (value: number[]) => {
        setMediaFilters({ minPhotos: value[0] ?? 1 });
    };

    return (
        <ScrollArea className="-mx-6 h-full px-6">
            <div className="space-y-6 py-2">
                {/* Crop size */}
                <div>
                    <Label className={`mb-4 flex items-center gap-2 ${getTypographyClasses('subheading' as TypographyVariantInput)}`}>
                        <Camera size={18} weight="bold" />
                        Photo Crop Size
                    </Label>
                    <p className={`mb-3 ${getTypographyClasses('bodySmall' as TypographyVariantInput)}`}>
                        Filter profiles by photo aspect ratio
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: 'any', label: 'Any Size', icon: '📐' },
                            { value: 'square', label: 'Square (1:1)', icon: '⬜' },
                            { value: 'portrait', label: 'Portrait (3:4)', icon: '📱' },
                            { value: 'landscape', label: 'Landscape (4:3)', icon: '🖼️' },
                        ].map(({ value, label, icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => handleCropSizeChange(value as CropSize)}
                                className={cn(
                                    'rounded-lg border-2 p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]',
                                    mediaFilters.cropSize === value
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:border-primary/50',
                                )}
                            >
                                <div className="mb-1 text-2xl">{icon}</div>
                                <div className={getTypographyClasses('bodyMedium' as TypographyVariantInput)}>{label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Photo quality */}
                <div>
                    <Label className={`mb-4 flex items-center gap-2 ${getTypographyClasses('subheading' as TypographyVariantInput)}`}>
                        <Sparkle size={18} weight="bold" />
                        Photo Quality
                    </Label>
                    <p className={`mb-3 ${getTypographyClasses('bodySmall' as TypographyVariantInput)}`}>
                        Prefer high-quality or verified photos
                    </p>
                    <div className="flex flex-col gap-2">
                        {[
                            {
                                value: 'any',
                                label: 'Any Quality',
                                desc: 'Show all profiles',
                            },
                            {
                                value: 'high',
                                label: 'High Quality',
                                desc: 'Clear, well-lit photos only',
                            },
                            {
                                value: 'verified',
                                label: 'Verified Photos',
                                desc: 'Authenticated by moderators',
                            },
                        ].map(({ value, label, desc }) => {
                            const isSelected = mediaFilters.photoQuality === value;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handlePhotoQualityChange(value as PhotoQuality)}
                                    className={cn(
                                        'rounded-lg border-2 p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]',
                                        isSelected
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50',
                                    )}
                                >
                                    <div className={`flex items-center gap-2 ${getTypographyClasses('bodyMedium')}`}>
                                        {isSelected && (
                                            <CheckCircle
                                                size={16}
                                                weight="fill"
                                                className="text-primary"
                                            />
                                        )}
                                        {label}
                                    </div>
                                    <div className={`mt-1 ${getTypographyClasses('bodySmall')}`}>{desc}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <Separator />

                {/* Video content */}
                <div>
                    <Label className={`mb-4 flex items-center gap-2 ${getTypographyClasses('subheading' as TypographyVariantInput)}`}>
                        <VideoCamera size={18} weight="bold" />
                        Video Content
                    </Label>
                    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                        <div>
                            <div className={getTypographyClasses('bodyMedium')}>Has Video</div>
                            <div className={`mt-1 ${getTypographyClasses('bodySmall')}`}>
                                Only show profiles with video content
                            </div>
                        </div>
                        <Switch
                            checked={mediaFilters.hasVideo === true}
                            onCheckedChange={handleHasVideoChange}
                        />
                    </div>
                </div>

                <Separator />

                {/* Min photos */}
                <div>
                    <Label className={`mb-4 flex items-center gap-2 ${getTypographyClasses('subheading' as TypographyVariantInput)}`}>
                        <Camera size={18} weight="bold" />
                        Minimum Photos
                    </Label>
                    <p className={`mb-3 ${getTypographyClasses('bodySmall' as TypographyVariantInput)}`}>
                        Profiles must have at least this many photos
                    </p>
                    <div className="mb-2 flex items-center justify-between">
                        <span className={getTypographyClasses('bodySmall')}>Minimum</span>
                        <span className={getTypographyClasses('bodyMedium')}>
                            {mediaFilters.minPhotos} photo{mediaFilters.minPhotos !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <Slider
                        value={[mediaFilters.minPhotos]}
                        onValueChange={handleMinPhotosChange}
                        min={1}
                        max={10}
                        step={1}
                        className="w-full"
                    />
                </div>
            </div>
        </ScrollArea>
    );
}
