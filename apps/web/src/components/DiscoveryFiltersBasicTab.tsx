'use client';

import React from 'react';
import { X } from '@phosphor-icons/react';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
    ALL_INTERESTS,
    ALL_LOOKING_FOR,
    ALL_PERSONALITIES,
    ALL_SIZES,
    type DiscoveryPreferences,
    type PetSize,
} from '@/components/discovery-preferences';

import { getTypographyClasses } from '@/lib/typography';

interface BasicTabProps {
    draft: DiscoveryPreferences;
    onDraftChange(next: DiscoveryPreferences): void;
}

export function DiscoveryFiltersBasicTab({ draft, onDraftChange }: BasicTabProps) {
    const handleSliderChange =
        (field: 'minAge' | 'maxAge' | 'maxDistance' | 'minCompatibility') =>
            (value: number[]) => {
                const nextValue = value[0] ?? 0;
                onDraftChange({ ...draft, [field]: nextValue });
            };

    const toggleSize = (size: PetSize) => {
        const sizes = draft.sizes.includes(size)
            ? draft.sizes.filter((s: PetSize) => s !== size)
            : [...draft.sizes, size];

        onDraftChange({ ...draft, sizes });
    };

    const toggleStringArray =
        (field: 'personalities' | 'interests' | 'lookingFor') =>
            (value: string) => {
                const current = draft[field] ?? [];
                const next = current.includes(value)
                    ? current.filter((item: string) => item !== value)
                    : [...current, value];

                onDraftChange({ ...draft, [field]: next });
            };

    const { minAge, maxAge, maxDistance, minCompatibility } = draft;

    const personalitiesCount = draft.personalities.length;
    const interestsCount = draft.interests.length;
    const lookingForCount = draft.lookingFor.length;

    return (
        <ScrollArea className="-mx-6 h-full px-6">
            <div className="space-y-6 py-2">
                {/* Age range */}
                <div>
                    <Label className={`mb-4 block ${getTypographyClasses('h2')}`}>Age Range</Label>
                    <div className="space-y-4">
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <span className={`${getTypographyClasses('body-small')} text-muted-foreground`}>Minimum Age</span>
                                <span className={getTypographyClasses('body')}>
                                    {minAge} {minAge === 1 ? 'year' : 'years'}
                                </span>
                            </div>
                            <Slider
                                value={[minAge]}
                                onValueChange={handleSliderChange('minAge')}
                                max={15}
                                step={1}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <span className={`${getTypographyClasses('body-small')} text-muted-foreground`}>Maximum Age</span>
                                <span className={getTypographyClasses('body')}>
                                    {maxAge} {maxAge === 1 ? 'year' : 'years'}
                                </span>
                            </div>
                            <Slider
                                value={[maxAge]}
                                onValueChange={handleSliderChange('maxAge')}
                                max={15}
                                step={1}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Size */}
                <div>
                    <Label className={`mb-3 block ${getTypographyClasses('h2')}`}>
                        Size Preferences
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {ALL_SIZES.map((size: PetSize) => {
                            const isSelected = draft.sizes.includes(size);
                            return (
                                <Badge
                                    key={size}
                                    variant={isSelected ? 'default' : 'outline'}
                                    className="cursor-pointer capitalize transition-all hover:scale-105"
                                    onClick={() => toggleSize(size)}
                                >
                                    {size.replace('-', ' ')}
                                    {isSelected && <X size={14} className="ml-1" weight="bold" />}
                                </Badge>
                            );
                        })}
                    </div>
                </div>

                <Separator />

                {/* Distance */}
                <div>
                    <Label className={`mb-4 block ${getTypographyClasses('h2')}`}>
                        Maximum Distance
                    </Label>
                    <div className="mb-2 flex items-center justify-between">
                        <span className={`text-sm ${getTypographyClasses('body-small')}`}>Within</span>
                        <span className={getTypographyClasses('body')}>
                            {maxDistance} miles
                        </span>
                    </div>
                    <Slider
                        value={[maxDistance]}
                        onValueChange={handleSliderChange('maxDistance')}
                        min={5}
                        max={100}
                        step={5}
                        className="w-full"
                    />
                </div>

                <Separator />

                {/* Personality */}
                <div>
                    <Label className={`mb-3 block ${getTypographyClasses('h2')}`}>
                        Personality Traits{' '}
                        {personalitiesCount > 0 && (
                            <span className={`text-xs ${getTypographyClasses('body-small')}`}>
                                ({personalitiesCount} selected)
                            </span>
                        )}
                    </Label>
                    <p className={`mb-3 text-xs ${getTypographyClasses('body-small')}`}>
                        Find pets with these personality traits
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {ALL_PERSONALITIES.map((trait: string) => {
                            const isSelected = draft.personalities.includes(trait);
                            return (
                                <Badge
                                    key={trait}
                                    variant={isSelected ? 'default' : 'outline'}
                                    className="cursor-pointer capitalize transition-all hover:scale-105"
                                    onClick={() => toggleStringArray('personalities')(trait)}
                                >
                                    {trait}
                                    {isSelected && <X size={14} className="ml-1" weight="bold" />}
                                </Badge>
                            );
                        })}
                    </div>
                </div>

                <Separator />

                {/* Interests */}
                <div>
                    <Label className={`mb-3 block ${getTypographyClasses('h2')}`}>
                        Interests{' '}
                        {interestsCount > 0 && (
                            <span className={`text-xs ${getTypographyClasses('body-small')}`}>
                                ({interestsCount} selected)
                            </span>
                        )}
                    </Label>
                    <p className={`mb-3 text-xs ${getTypographyClasses('body-small')}`}>
                        Find pets who enjoy these activities
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {ALL_INTERESTS.map((interest: string) => {
                            const isSelected = draft.interests.includes(interest);
                            return (
                                <Badge
                                    key={interest}
                                    variant={isSelected ? 'default' : 'outline'}
                                    className="cursor-pointer capitalize transition-all hover:scale-105"
                                    onClick={() => toggleStringArray('interests')(interest)}
                                >
                                    {interest}
                                    {isSelected && <X size={14} className="ml-1" weight="bold" />}
                                </Badge>
                            );
                        })}
                    </div>
                </div>

                <Separator />

                {/* Looking for */}
                <div>
                    <Label className={`mb-3 block ${getTypographyClasses('h2')}`}>
                        Looking For{' '}
                        {lookingForCount > 0 && (
                            <span className={`text-xs ${getTypographyClasses('body-small')}`}>
                                ({lookingForCount} selected)
                            </span>
                        )}
                    </Label>
                    <p className={`mb-3 text-xs ${getTypographyClasses('body-small')}`}>
                        Find pets seeking these connections
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {ALL_LOOKING_FOR.map((goal: string) => {
                            const isSelected = draft.lookingFor.includes(goal);
                            return (
                                <Badge
                                    key={goal}
                                    variant={isSelected ? 'default' : 'outline'}
                                    className="cursor-pointer capitalize transition-all hover:scale-105"
                                    onClick={() => toggleStringArray('lookingFor')(goal)}
                                >
                                    {goal}
                                    {isSelected && <X size={14} className="ml-1" weight="bold" />}
                                </Badge>
                            );
                        })}
                    </div>
                </div>

                <Separator />

                {/* Min compatibility */}
                <div>
                    <Label className={`mb-4 block ${getTypographyClasses('h2')}`}>
                        Minimum Compatibility Score
                    </Label>
                    <p className={`mb-3 text-xs ${getTypographyClasses('body-small')}`}>
                        Only show pets with at least this compatibility
                    </p>
                    <div className="mb-2 flex items-center justify-between">
                        <span className={`text-sm ${getTypographyClasses('body-small')}`}>Minimum Score</span>
                        <span className={getTypographyClasses('body')}>
                            {minCompatibility}%
                        </span>
                    </div>
                    <Slider
                        value={[minCompatibility]}
                        onValueChange={handleSliderChange('minCompatibility')}
                        min={0}
                        max={90}
                        step={10}
                        className="w-full"
                    />
                </div>
            </div>
        </ScrollArea>
    );
}
