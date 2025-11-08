import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import type {
  AdoptionListingFilters,
  AdoptionListingStatus,
} from '@/lib/adoption-marketplace-types';
import { haptics } from '@/lib/haptics';
import { X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

interface AdoptionFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AdoptionListingFilters;
  onFiltersChange: (filters: AdoptionListingFilters) => void;
}

const SPECIES_OPTIONS = ['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other'] as const;
const SIZE_OPTIONS = ['tiny', 'small', 'medium', 'large', 'extra-large'] as const;
const ENERGY_LEVELS = ['low', 'medium', 'high', 'very-high'] as const;
const STATUS_OPTIONS: AdoptionListingStatus[] = [
  'active',
  'pending_review',
  'adopted',
  'withdrawn',
];
const SORT_OPTIONS = ['recent', 'distance', 'age', 'fee_low', 'fee_high'] as const;

export function AdoptionFiltersSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: AdoptionFiltersSheetProps) {
  const [localFilters, setLocalFilters] = useState<AdoptionListingFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSpeciesToggle = (species: string) => {
    const current = localFilters.species || [];
    const updated = current.includes(species)
      ? current.filter((s) => s !== species)
      : [...current, species];
    const newFilters = { ...localFilters };
    if (updated.length > 0) {
      newFilters.species = updated;
    } else {
      delete newFilters.species;
    }
    setLocalFilters(newFilters);
    haptics.impact('light');
  };

  const handleSizeToggle = (size: string) => {
    const current = localFilters.size || [];
    const updated = current.includes(size) ? current.filter((s) => s !== size) : [...current, size];
    const newFilters = { ...localFilters };
    if (updated.length > 0) {
      newFilters.size = updated;
    } else {
      delete newFilters.size;
    }
    setLocalFilters(newFilters);
    haptics.impact('light');
  };

  const handleEnergyLevelToggle = (level: string) => {
    const current = localFilters.energyLevel || [];
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    const newFilters = { ...localFilters };
    if (updated.length > 0) {
      newFilters.energyLevel = updated;
    } else {
      delete newFilters.energyLevel;
    }
    setLocalFilters(newFilters);
    haptics.impact('light');
  };

  const handleStatusToggle = (status: AdoptionListingStatus) => {
    const current = localFilters.status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    const newFilters = { ...localFilters };
    if (updated.length > 0) {
      newFilters.status = updated;
    } else {
      delete newFilters.status;
    }
    setLocalFilters(newFilters);
    haptics.impact('light');
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    haptics.trigger('light');
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    if (typeof haptics.success === 'function') {
      haptics.success();
    }
    onOpenChange(false);
  };

  const hasActiveFilters = () => {
    return !!(
      localFilters.species?.length ||
      localFilters.size?.length ||
      localFilters.ageMin ||
      localFilters.ageMax ||
      localFilters.location ||
      localFilters.maxDistance ||
      localFilters.goodWithKids !== undefined ||
      localFilters.goodWithPets !== undefined ||
      localFilters.vaccinated !== undefined ||
      localFilters.spayedNeutered !== undefined ||
      localFilters.energyLevel?.length ||
      localFilters.feeMax ||
      localFilters.status?.length ||
      localFilters.featured !== undefined ||
      localFilters.sortBy
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Adoption Listings</SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Species */}
          <div className="space-y-3">
            <Label>Species</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIES_OPTIONS.map((species) => (
                <Badge
                  key={species}
                  variant={localFilters.species?.includes(species) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleSpeciesToggle(species)}
                >
                  {species.charAt(0).toUpperCase() + species.slice(1)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="space-y-3">
            <Label>Size</Label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((size) => (
                <Badge
                  key={size}
                  variant={localFilters.size?.includes(size) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleSizeToggle(size)}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-3">
            <Label>Age Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ageMin" className="text-xs">
                  Min Age
                </Label>
                <Input
                  id="ageMin"
                  type="number"
                  min="0"
                  max="30"
                  value={localFilters.ageMin || ''}
                  onChange={(e) => {
                    const newFilters = { ...localFilters };
                    if (e.target.value) {
                      newFilters.ageMin = Number(e.target.value);
                    } else {
                      delete newFilters.ageMin;
                    }
                    setLocalFilters(newFilters);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ageMax" className="text-xs">
                  Max Age
                </Label>
                <Input
                  id="ageMax"
                  type="number"
                  min="0"
                  max="30"
                  value={localFilters.ageMax || ''}
                  onChange={(e) => {
                    const newFilters = { ...localFilters };
                    if (e.target.value) {
                      newFilters.ageMax = Number(e.target.value);
                    } else {
                      delete newFilters.ageMax;
                    }
                    setLocalFilters(newFilters);
                  }}
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={localFilters.location || ''}
              onChange={(e) => {
                const newFilters = { ...localFilters };
                if (e.target.value) {
                  newFilters.location = e.target.value;
                } else {
                  delete newFilters.location;
                }
                setLocalFilters(newFilters);
              }}
              placeholder="City or zip code"
            />
          </div>

          {/* Max Distance */}
          {localFilters.location && (
            <div className="space-y-3">
              <Label>Max Distance</Label>
              <div className="px-2">
                <Slider
                  value={[localFilters.maxDistance || 50]}
                  onValueChange={([value]) => {
                    const newFilters = { ...localFilters };
                    if (value !== undefined) {
                      newFilters.maxDistance = value;
                    } else {
                      delete newFilters.maxDistance;
                    }
                    setLocalFilters(newFilters);
                  }}
                  min={1}
                  max={100}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 km</span>
                  <span>{localFilters.maxDistance || 50} km</span>
                  <span>100 km</span>
                </div>
              </div>
            </div>
          )}

          {/* Traits */}
          <div className="space-y-3">
            <Label>Traits</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="goodWithKids"
                  checked={localFilters.goodWithKids === true}
                  onCheckedChange={(checked) => {
                    const newFilters = { ...localFilters };
                    if (checked) {
                      newFilters.goodWithKids = true;
                    } else {
                      delete newFilters.goodWithKids;
                    }
                    setLocalFilters(newFilters);
                  }}
                />
                <Label htmlFor="goodWithKids" className="text-sm font-normal cursor-pointer">
                  Good with Kids
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="goodWithPets"
                  checked={localFilters.goodWithPets === true}
                  onCheckedChange={(checked) => {
                    const newFilters = { ...localFilters };
                    if (checked) {
                      newFilters.goodWithPets = true;
                    } else {
                      delete newFilters.goodWithPets;
                    }
                    setLocalFilters(newFilters);
                  }}
                />
                <Label htmlFor="goodWithPets" className="text-sm font-normal cursor-pointer">
                  Good with Other Pets
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vaccinated"
                  checked={localFilters.vaccinated === true}
                  onCheckedChange={(checked) => {
                    const newFilters = { ...localFilters };
                    if (checked) {
                      newFilters.vaccinated = true;
                    } else {
                      delete newFilters.vaccinated;
                    }
                    setLocalFilters(newFilters);
                  }}
                />
                <Label htmlFor="vaccinated" className="text-sm font-normal cursor-pointer">
                  Vaccinated
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="spayedNeutered"
                  checked={localFilters.spayedNeutered === true}
                  onCheckedChange={(checked) => {
                    const newFilters = { ...localFilters };
                    if (checked) {
                      newFilters.spayedNeutered = true;
                    } else {
                      delete newFilters.spayedNeutered;
                    }
                    setLocalFilters(newFilters);
                  }}
                />
                <Label htmlFor="spayedNeutered" className="text-sm font-normal cursor-pointer">
                  Spayed/Neutered
                </Label>
              </div>
            </div>
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <Label>Energy Level</Label>
            <div className="flex flex-wrap gap-2">
              {ENERGY_LEVELS.map((level) => (
                <Badge
                  key={level}
                  variant={localFilters.energyLevel?.includes(level) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleEnergyLevelToggle(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Max Fee */}
          <div className="space-y-3">
            <Label htmlFor="feeMax">Max Adoption Fee</Label>
            <Input
              id="feeMax"
              type="number"
              min="0"
              value={localFilters.feeMax || ''}
              onChange={(e) => {
                const newFilters = { ...localFilters };
                if (e.target.value) {
                  newFilters.feeMax = Number(e.target.value);
                } else {
                  delete newFilters.feeMax;
                }
                setLocalFilters(newFilters);
              }}
              placeholder="No limit"
            />
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Badge
                  key={status}
                  variant={localFilters.status?.includes(status) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleStatusToggle(status)}
                >
                  {status.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-3">
            <Label htmlFor="sortBy">Sort By</Label>
            <Select
              value={localFilters.sortBy || 'recent'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  sortBy: value as (typeof SORT_OPTIONS)[number],
                })
              }
            >
              <SelectTrigger id="sortBy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Featured */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={localFilters.featured === true}
              onCheckedChange={(checked) => {
                const newFilters = { ...localFilters };
                if (checked) {
                  newFilters.featured = true;
                } else {
                  delete newFilters.featured;
                }
                setLocalFilters(newFilters);
              }}
            />
            <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
              Featured Listings Only
            </Label>
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2">
          {hasActiveFilters() && (
            <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
              <X size={16} className="mr-2" />
              Clear All
            </Button>
          )}
          <Button onClick={handleApply} className="w-full sm:w-auto">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
