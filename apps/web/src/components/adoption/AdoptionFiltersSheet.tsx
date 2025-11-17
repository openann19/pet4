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
import { getTypographyClasses } from '@/lib/typography';
import { MotionView } from '@petspark/motion';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';

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
    haptics.impact('light');
    applyFilters();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-100 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className={getTypographyClasses('h2')}>Filter Adoption Listings</SheetTitle>
          <SheetDescription className={getTypographyClasses('body')}>
            Use filters to find the perfect pet for adoption. Select species, size, traits, and more.                                                           
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-8">
          {/* Species */}
          <div className="space-y-4">
            <Label className={cn(getTypographyClasses('body'), 'font-medium')}>Species</Label>
            <div className="flex flex-wrap gap-2.5">
              {SPECIES_OPTIONS.map((species) => {
                const isSelected = localFilters.species?.includes(species);
                return (
                  <MotionView
                    key={species}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Badge
                      variant={isSelected ? 'default' : 'outline'}                                                                     
                      className={cn(
                        'cursor-pointer transition-all duration-200 rounded-lg px-3 py-1.5 text-sm font-medium',
                        isSelected 
                          ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg' 
                          : 'hover:border-primary/50 hover:bg-primary/5',
                        FocusRing.standard
                      )}
                      onClick={() => {
                        haptics.impact('light');
                        toggleArrayFilter('species', species);
                      }}
                      onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          haptics.impact('light');
                          toggleArrayFilter('species', species);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected ? 'true' : 'false'}                                                                     
                    >
                      {species.charAt(0).toUpperCase() + species.slice(1)}
                    </Badge>
                  </MotionView>
                );
              })}
            </div>
          </div>

          {/* Size */}
          <div className="space-y-4">
            <Label className={cn(getTypographyClasses('body'), 'font-medium')}>Size</Label>
            <div className="flex flex-wrap gap-2.5">
              {SIZE_OPTIONS.map((size) => {
                const isSelected = localFilters.size?.includes(size);
                return (
                  <MotionView
                    key={size}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Badge
                      variant={isSelected ? 'default' : 'outline'}                                                                           
                      className={cn(
                        'cursor-pointer transition-all duration-200 rounded-lg px-3 py-1.5 text-sm font-medium',
                        isSelected 
                          ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg' 
                          : 'hover:border-primary/50 hover:bg-primary/5',
                        FocusRing.standard
                      )}
                      onClick={() => {
                        haptics.impact('light');
                        toggleArrayFilter('size', size);
                      }}
                      onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          haptics.impact('light');
                          toggleArrayFilter('size', size);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected ? 'true' : 'false'}                                                                           
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Badge>
                  </MotionView>
                );
              })}
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-4">
            <Label className={cn(getTypographyClasses('body'), 'font-medium')}>Age Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ageMin" className={getTypographyClasses('bodyMuted')}>
                  Min Age
                </Label>
                <Input
                  id="ageMin"
                  type="number"
                  min="0"
                  max="30"
                  value={localFilters.ageMin ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateFilters({
                      ageMin: e.target.value ? Number(e.target.value) : undefined,                                                                              
                    });
                  }}
                  placeholder="0"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ageMax" className={getTypographyClasses('bodyMuted')}>
                  Max Age
                </Label>
                <Input
                  id="ageMax"
                  type="number"
                  min="0"
                  max="30"
                  value={localFilters.ageMax ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateFilters({
                      ageMax: e.target.value ? Number(e.target.value) : undefined,                                                                              
                    });
                  }}
                  placeholder="30"
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <Label htmlFor="location" className={cn(getTypographyClasses('body'), 'font-medium')}>Location</Label>
            <Input
              id="location"
                  value={localFilters.location ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateFilters({
                  location: e.target.value || undefined, // Keep || for empty string check
                });
              }}
              placeholder="City or zip code"
              className="rounded-xl"
            />
          </div>

          {/* Max Distance */}
          {localFilters.location && (
            <div className="space-y-4">
              <Label className={cn(getTypographyClasses('body'), 'font-medium')}>Max Distance</Label>
              <div className="px-2">
                <Slider
                  value={[localFilters.maxDistance ?? 50]}
                  onValueChange={([value]) => {
                    haptics.impact('light');
                    updateFilters({
                      maxDistance: value !== undefined ? value : undefined,
                    });
                  }}
                  min={1}
                  max={100}
                  step={1}
                />
                <div className={cn('flex justify-between mt-2 text-muted-foreground', getTypographyClasses('bodyMuted'))}>                                                                       
                  <span>1 km</span>
                  <span className="font-medium">{localFilters.maxDistance ?? 50} km</span>
                  <span>100 km</span>
                </div>
              </div>
            </div>
          )}

          {/* Traits */}
          <div className="space-y-4">
            <Label className={cn(getTypographyClasses('body'), 'font-medium')}>Traits</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="goodWithKids"
                  checked={localFilters.goodWithKids === true}
                  onCheckedChange={(checked) => {
                    haptics.impact('light');
                    toggleBooleanFilter('goodWithKids', checked === true);
                  }}
                />
                <Label htmlFor="goodWithKids" className={cn(getTypographyClasses('body'), 'cursor-pointer')}>                                                                   
                  Good with Kids
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="goodWithPets"
                  checked={localFilters.goodWithPets === true}
                  onCheckedChange={(checked) => {
                    haptics.impact('light');
                    toggleBooleanFilter('goodWithPets', checked === true);
                  }}
                />
                <Label htmlFor="goodWithPets" className={cn(getTypographyClasses('body'), 'cursor-pointer')}>                                                                   
                  Good with Other Pets
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="vaccinated"
                  checked={localFilters.vaccinated === true}
                  onCheckedChange={(checked) => {
                    haptics.impact('light');
                    toggleBooleanFilter('vaccinated', checked === true);
                  }}
                />
                <Label htmlFor="vaccinated" className={cn(getTypographyClasses('body'), 'cursor-pointer')}>                                                                     
                  Vaccinated
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="spayedNeutered"
                  checked={localFilters.spayedNeutered === true}
                  onCheckedChange={(checked) => {
                    haptics.impact('light');
                    toggleBooleanFilter('spayedNeutered', checked === true);
                  }}
                />
                <Label htmlFor="spayedNeutered" className={cn(getTypographyClasses('body'), 'cursor-pointer')}>                                                                 
                  Spayed/Neutered
                </Label>
              </div>
            </div>
          </div>

          {/* Energy Level */}
          <div className="space-y-4">
            <Label className={cn(getTypographyClasses('body'), 'font-medium')}>Energy Level</Label>
            <div className="flex flex-wrap gap-2.5">
              {ENERGY_LEVELS.map((level) => {
                const isSelected = localFilters.energyLevel?.includes(level);
                return (
                  <MotionView
                    key={level}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Badge
                      variant={isSelected ? 'default' : 'outline'}                                                                   
                      className={cn(
                        'cursor-pointer transition-all duration-200 rounded-lg px-3 py-1.5 text-sm font-medium',
                        isSelected 
                          ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg' 
                          : 'hover:border-primary/50 hover:bg-primary/5',
                        FocusRing.standard
                      )}
                      onClick={() => {
                        haptics.impact('light');
                        toggleArrayFilter('energyLevel', level);
                      }}
                      onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          haptics.impact('light');
                          toggleArrayFilter('energyLevel', level);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected ? 'true' : 'false'}                                                                   
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Badge>
                  </MotionView>
                );
              })}
            </div>
          </div>

          {/* Max Fee */}
          <div className="space-y-4">
            <Label htmlFor="feeMax" className={cn(getTypographyClasses('body'), 'font-medium')}>Max Adoption Fee</Label>
            <Input
              id="feeMax"
              type="number"
              min="0"
              value={localFilters.feeMax ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateFilters({
                  feeMax: e.target.value ? Number(e.target.value) : undefined,
                });
              }}
              placeholder="No limit"
              className="rounded-xl"
            />
          </div>

          {/* Status */}
          <div className="space-y-4">
            <Label className={cn(getTypographyClasses('body'), 'font-medium')}>Status</Label>
            <div className="flex flex-wrap gap-2.5">
              {STATUS_OPTIONS.map((status) => {
                const isSelected = localFilters.status?.includes(status);
                return (
                  <MotionView
                    key={status}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Badge
                      variant={isSelected ? 'default' : 'outline'}                                                                       
                      className={cn(
                        'cursor-pointer transition-all duration-200 rounded-lg px-3 py-1.5 text-sm font-medium',
                        isSelected 
                          ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg' 
                          : 'hover:border-primary/50 hover:bg-primary/5',
                        FocusRing.standard
                      )}
                      onClick={() => {
                        haptics.impact('light');
                        toggleArrayFilter('status', status);
                      }}
                      onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          haptics.impact('light');
                          toggleArrayFilter('status', status);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected ? 'true' : 'false'}                                                                       
                    >
                      {status.replace('_', ' ')}
                    </Badge>
                  </MotionView>
                );
              })}
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-4">
            <Label htmlFor="sortBy" className={cn(getTypographyClasses('body'), 'font-medium')}>Sort By</Label>
            <Select
              value={localFilters.sortBy ?? 'recent'}
              onValueChange={(value) => {
                haptics.impact('light');
                updateFilters({
                  sortBy: value as (typeof SORT_OPTIONS)[number],
                });
              }}
            >
              <SelectTrigger id="sortBy" aria-label="Sort adoption listings by" className="rounded-xl">
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
          <div className="flex items-center space-x-3">
            <Checkbox
              id="featured"
              checked={localFilters.featured === true}
              onCheckedChange={(checked) => {
                haptics.impact('light');
                toggleBooleanFilter('featured', checked === true);
              }}
            />
            <Label htmlFor="featured" className={cn(getTypographyClasses('body'), 'cursor-pointer')}>                                                                           
              Featured Listings Only
            </Label>
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-3 pt-4">
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                haptics.impact('light');
                clearFilters();
              }} 
              className="w-full sm:w-auto rounded-xl" 
              aria-label="Clear all filters"
            >                                       
              <X size={18} className="mr-2" aria-hidden="true" />
              Clear All
            </Button>
          )}
          <Button 
            onClick={handleApply} 
            size="lg"
            className="w-full sm:w-auto rounded-xl shadow-lg hover:shadow-xl transition-all" 
            aria-label="Apply filters"
          >                                                                
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
