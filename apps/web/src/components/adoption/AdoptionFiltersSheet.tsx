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
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import type {
  AdoptionListingFilters,
  AdoptionListingStatus,
} from '@/lib/adoption-marketplace-types';
import { X } from '@phosphor-icons/react';
import { FocusRing } from '@/core/tokens';
import { useAdoptionFilters } from '@/hooks/use-adoption-filters';

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
  const {
    localFilters,
    toggleArrayFilter,
    toggleBooleanFilter,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    applyFilters,
  } = useAdoptionFilters({
    initialFilters: filters,
    onFiltersChange,
  });

  const handleApply = () => {
    applyFilters();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-100 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Adoption Listings</SheetTitle>
          <SheetDescription>
            Use filters to find the perfect pet for adoption. Select species, size, traits, and more.
          </SheetDescription>
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
                  className={`cursor-pointer ${FocusRing.standard}`}
                  onClick={() => toggleArrayFilter('species', species)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleArrayFilter('species', species);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={localFilters.species?.includes(species) ? 'true' : 'false'}
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
                  className={`cursor-pointer ${FocusRing.standard}`}
                  onClick={() => toggleArrayFilter('size', size)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleArrayFilter('size', size);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={localFilters.size?.includes(size) ? 'true' : 'false'}
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
                    updateFilters({
                      ageMin: e.target.value ? Number(e.target.value) : undefined,
                    });
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
                    updateFilters({
                      ageMax: e.target.value ? Number(e.target.value) : undefined,
                    });
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
                updateFilters({
                  location: e.target.value || undefined,
                });
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
                    updateFilters({
                      maxDistance: value !== undefined ? value : undefined,
                    });
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
                    toggleBooleanFilter('goodWithKids', checked === true);
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
                    toggleBooleanFilter('goodWithPets', checked === true);
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
                    toggleBooleanFilter('vaccinated', checked === true);
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
                    toggleBooleanFilter('spayedNeutered', checked === true);
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
                  className={`cursor-pointer ${FocusRing.standard}`}
                  onClick={() => toggleArrayFilter('energyLevel', level)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleArrayFilter('energyLevel', level);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={localFilters.energyLevel?.includes(level) ? 'true' : 'false'}
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
                updateFilters({
                  feeMax: e.target.value ? Number(e.target.value) : undefined,
                });
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
                  className={`cursor-pointer ${FocusRing.standard}`}
                  onClick={() => toggleArrayFilter('status', status)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleArrayFilter('status', status);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={localFilters.status?.includes(status) ? 'true' : 'false'}
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
              onValueChange={(value) => {
                updateFilters({
                  sortBy: value as (typeof SORT_OPTIONS)[number],
                });
              }}
            >
              <SelectTrigger id="sortBy" aria-label="Sort adoption listings by">
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
                toggleBooleanFilter('featured', checked === true);
              }}
            />
            <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
              Featured Listings Only
            </Label>
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2">
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto" aria-label="Clear all filters">
              <X size={16} className="mr-2" aria-hidden="true" />
              Clear All
            </Button>
          )}
          <Button onClick={handleApply} className="w-full sm:w-auto" aria-label="Apply filters">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
