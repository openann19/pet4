import { MapControls } from './MapControls';
import { PrivacyBanner } from './PrivacyBanner';
import { PreciseSharingBanner } from './PreciseSharingBanner';

export interface MapTopControlsProps {
  searchQuery: string;
  selectedCategory: string | null;
  showList: boolean;
  isLocating: boolean;
  locationPermission: 'granted' | 'denied' | 'prompt';
  preciseSharingEnabled: boolean;
  preciseSharingUntil: number | null;
  onSearchChange: (query: string) => void;
  onCategoryFilter: (categoryId: string) => void;
  onToggleList: () => void;
  onRequestLocation: () => void;
  onEnablePrecise: () => void;
  onDisablePrecise: () => void;
}

export function MapTopControls({
  searchQuery,
  selectedCategory,
  showList,
  isLocating,
  locationPermission,
  preciseSharingEnabled,
  preciseSharingUntil,
  onSearchChange,
  onCategoryFilter,
  onToggleList,
  onRequestLocation,
  onEnablePrecise,
  onDisablePrecise,
}: MapTopControlsProps): React.JSX.Element {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 space-y-3">
      <MapControls
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        showList={showList}
        isLocating={isLocating}
        onSearchChange={onSearchChange}
        onCategoryFilter={onCategoryFilter}
        onToggleList={onToggleList}
        onRequestLocation={onRequestLocation}
      />

      {locationPermission === 'granted' && !preciseSharingEnabled && (
        <PrivacyBanner onEnablePrecise={onEnablePrecise} />
      )}

      {preciseSharingEnabled && preciseSharingUntil && (
        <PreciseSharingBanner
          expiresInMinutes={(preciseSharingUntil - Date.now()) / 60000}
          onDisable={onDisablePrecise}
        />
      )}
    </div>
  );
}

