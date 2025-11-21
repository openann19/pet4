import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import { useMapLocation } from './map/hooks/use-map-location';
import { usePreciseSharing } from './map/hooks/use-precise-sharing';
import { useMapPlaces } from './map/hooks/use-map-places';
import { useMapUIState } from './map/hooks/use-map-ui-state';
import { useMapViewLogic } from './map/hooks/use-map-view-logic';
import { PlacesListSidebar } from './map/components/PlacesListSidebar';
import { PlaceDetailSheet } from './map/components/PlaceDetailSheet';
import { MapStatsFooter } from './map/components/MapStatsFooter';
import { MapContainer } from './map/components/MapContainer';
import { MapTopControls } from './map/components/MapTopControls';

export default function MapView() {
  const { mapSettings } = useMapConfig();

  const location = useMapLocation();
  const preciseSharing = usePreciseSharing();
  const places = useMapPlaces(location.userLocation, mapSettings.DEFAULT_RADIUS_KM);
  const uiState = useMapUIState();
  const { displayLocation, handlePlaceClick } = useMapViewLogic(location, preciseSharing, uiState);

  return (
    <PageTransitionWrapper key="map-view" direction="up">
      <div className="relative h-[calc(100vh-12rem)] max-h-200 bg-background rounded-2xl overflow-hidden border border-border shadow-xl">
        <MapContainer
          displayLocation={displayLocation}
          preciseSharingEnabled={preciseSharing.preciseSharingEnabled}
          places={places.filteredPlaces}
          onPlaceClick={handlePlaceClick}
        />

        <MapTopControls
          searchQuery={places.searchQuery}
          selectedCategory={places.selectedCategory}
          showList={uiState.showList}
          isLocating={location.isLocating}
          locationPermission={location.locationPermission}
          preciseSharingEnabled={preciseSharing.preciseSharingEnabled}
          preciseSharingUntil={preciseSharing.preciseSharingUntil}
          onSearchChange={places.setSearchQuery}
          onCategoryFilter={places.handleCategoryFilter}
          onToggleList={() => uiState.setShowList(!uiState.showList)}
          onRequestLocation={() => void location.requestLocation()}
          onEnablePrecise={preciseSharing.handleEnablePreciseSharing}
          onDisablePrecise={preciseSharing.handleDisablePreciseSharing}
        />

        <PlacesListSidebar
          isVisible={uiState.showList}
          places={places.filteredPlaces}
          savedPlaces={places.savedPlaces}
          onClose={() => uiState.setShowList(false)}
          onPlaceClick={handlePlaceClick}
          onSavePlace={places.handleSavePlace}
        />

        <PlaceDetailSheet
          isVisible={uiState.selectedMarker?.type === 'place'}
          marker={uiState.selectedMarker}
          savedPlaces={places.savedPlaces}
          onClose={() => uiState.setSelectedMarker(null)}
          onSavePlace={places.handleSavePlace}
        />

        <MapStatsFooter
          placesCount={places.filteredPlaces.length}
          savedCount={places.savedPlaces.length}
          radiusKm={mapSettings.DEFAULT_RADIUS_KM}
        />
      </div>
    </PageTransitionWrapper>
  );
}
