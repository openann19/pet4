/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { Location } from '@/lib/maps/types';
import { useEffect, useMemo, useState, Suspense } from 'react';

interface InteractiveMapProps {
    center: Location;
    zoom?: number;
    markers?: MapMarker[];
    onMarkerClick?: (marker: MapMarker) => void;
    onMapClick?: (location: Location) => void;
    className?: string;
    height?: string;
    interactive?: boolean;
    clusterMarkers?: boolean;
}

export interface MapMarker {
    id: string;
    location: Location;
    data: unknown;
    icon?: any; // L.Icon | L.DivIcon from leaflet
    popup?: React.ReactNode;
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

// Dynamic import wrapper for leaflet
function DynamicLeafletMap({
    center,
    zoom = 13,
    markers = [],
    onMarkerClick,
    onMapClick,
    className = '',
    height = '100%',
    interactive = true,
    clusterMarkers = true,
}: InteractiveMapProps) {
    const [MapComponent, setMapComponent] = useState<React.ComponentType<any> | null>(null);

    useEffect(() => {
        let mounted = true;

        // Dynamic import to ensure leaflet is code-split
        import('./LeafletMap').then((module) => {
            if (mounted) {
                setMapComponent(() => module.default);
            }
        }).catch(() => {
            // Handle import error gracefully
            if (mounted) {
                setMapComponent(() => () => (
                    <div className="flex items-center justify-center h-full bg-muted/20">
                        <p className="text-sm text-muted-foreground">Unable to load map</p>
                    </div>
                ));
            }
        });

        return () => {
            mounted = false;
        };
    }, []);

    if (!MapComponent) {
        return <MapLoadingFallback />;
    }

    return (
        <div className={`relative ${String(className ?? '')}`} style={{ height }}>
            <MapComponent
                center={center}
                zoom={zoom}
                markers={markers}
                onMarkerClick={onMarkerClick}
                onMapClick={onMapClick}
                interactive={interactive}
                clusterMarkers={clusterMarkers}
            />
        </div>
    );
}

export default function LazyInteractiveMap(props: InteractiveMapProps): React.JSX.Element {
    return (
        <Suspense fallback={<MapLoadingFallback />}>
            <DynamicLeafletMap {...props} />
        </Suspense>
    );
}
