import { MagnifyingGlass, List, X, Crosshair } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { haptics } from '@/lib/haptics';
import { useApp } from '@/contexts/AppContext';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import { CategoryFilters } from './CategoryFilters';

export interface MapControlsProps {
  searchQuery: string;
  selectedCategory: string | null;
  showList: boolean;
  isLocating: boolean;
  onSearchChange: (query: string) => void;
  onCategoryFilter: (categoryId: string) => void;
  onToggleList: () => void;
  onRequestLocation: () => void;
}

export function MapControls({
  searchQuery,
  selectedCategory,
  showList,
  isLocating,
  onSearchChange,
  onCategoryFilter,
  onToggleList,
  onRequestLocation,
}: MapControlsProps): React.JSX.Element {
  const { t } = useApp();
  const { PLACE_CATEGORIES } = useMapConfig();

  return (
    <MotionView
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="backdrop-blur-xl bg-background/80 rounded-2xl shadow-2xl border border-border/50 p-3"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.map?.searchPlaceholder ?? 'Search places...'}
            aria-label="Search places on map"
            className="pl-10 h-11 bg-background/50 border-border"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            haptics.trigger('selection');
            onToggleList();
          }}
          className="h-11 w-11 rounded-xl hover:bg-primary/10"
          aria-label={showList ? 'Hide places list' : 'Show places list'}
        >
          {showList ? <X size={20} /> : <List size={20} />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRequestLocation}
          disabled={isLocating}
          className="h-11 w-11 rounded-xl hover:bg-primary/10"
          aria-label={isLocating ? 'Locating your position' : 'Use current location'}
        >
          <Crosshair size={20} className={isLocating ? 'animate-spin' : ''} />
        </Button>
      </div>

      <CategoryFilters selectedCategory={selectedCategory} onCategoryFilter={onCategoryFilter} />
    </MotionView>
  );
}

