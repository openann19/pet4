import { useRef, useState, useEffect, Suspense } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { Location } from '@/lib/maps/types';
import MapErrorBoundary from './MapErrorBoundary';

export interface MapMarker {
    id: string;
    location: Location;
    data: unknown;
    icon?: string;
    color?: string;
}

interface LazyMapLibreMapProps {
    center: Location;
    zoom?: number;
    markers?: MapMarker[];
    onMarkerClick?: (marker: MapMarker) => void;
    onMapClick?: (location: Location) => void;
    className?: string;
    height?: string;
    clusterMarkers?: boolean;
}

// Fallback loading component
function MapLoadingFallback() {
    return (
        <div className="flex items-center justify-center h-full bg-muted/20">
            <div className="text-center space-y-2">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
        </div>
    );
}

// Dynamic import wrapper for MapLibreMap
function DynamicMapLibreMap({
    center,
    zoom = 13,
    markers = [],
    onMarkerClick,
    onMapClick,
    className = '',
    height = '100%',
    clusterMarkers = true,
}: LazyMapLibreMapProps) {
    const { t } = useApp();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [MapComponent, setMapComponent] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
    const [_isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;

        // Dynamic import to ensure maplibre is code-split
        Promise.all([
            import('@/lib/maps/useMapLibreMap'),
            import('maplibre-gl').then(mod => mod.default || mod),
            import('maplibre-gl/dist/maplibre-gl.css')
        ]).then(([{ useMapLibreMap }, _maplibre]) => {
            if (!mounted) return;

            setMapComponent(() => {
                return function MapComponent() {
                    const { isLoading: mapLoading, error: mapError } = useMapLibreMap({
                        container: mapContainerRef.current,
                        center,
                        zoom,
                        markers,
                        onMarkerClick,
                        onMapClick,
                        clusterMarkers,
                    });

                    if (mapError) {
                        return (
                            <div className={`flex items-center justify-center ${String(className ?? '')}`} style={{ height }}>
                                <div className="text-center space-y-2 p-4">
                                    <p className="text-destructive font-semibold">
                                        {t.map?.errorLoadingMap || 'Error loading map'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{mapError.message}</p>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div className={`relative ${String(className ?? '')}`} style={{ height }}>
                            {mapLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                                    <div className="text-center space-y-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                                        <p className="text-sm text-muted-foreground">{t.map?.loading || 'Loading map...'}</p>
                                    </div>
                                </div>
                            )}
                            <div
                                ref={mapContainerRef}
                                className="w-full h-full min-h-[400px]"
                            />
                        </div>
                    );
                };
            });
            setIsLoading(false);
            setError(null);
        }).catch((err) => {
            if (!mounted) return;
            setError(err instanceof Error ? err : new Error(String(err)));
            setIsLoading(false);
        });

        return () => {
            mounted = false;
        };
    }, [center, zoom, className, height, t]);

    if (error) {
        return (
            <div className={`flex items-center justify-center ${String(className ?? '')}`} style={{ height }}>
                <div className="text-center space-y-2 p-4">
                    <p className="text-destructive font-semibold">
                        {t.map?.errorLoadingMap || 'Error loading map'}
                    </p>
                    <p className="text-sm text-muted-foreground">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!MapComponent) {
        return <MapLoadingFallback />;
    }

    return <MapComponent />;
}

export default function LazyMapLibreMap(props: LazyMapLibreMapProps): React.JSX.Element {
    return (
        <MapErrorBoundary>
            <Suspense fallback={<MapLoadingFallback />}>
                <DynamicMapLibreMap {...props} />
            </Suspense>
        </MapErrorBoundary>
    );
}
