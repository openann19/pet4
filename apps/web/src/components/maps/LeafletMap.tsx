/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { Location } from '@/lib/maps/types';
import { useEffect, useMemo, useState } from 'react';
import { isTruthy } from '@petspark/shared';
import type { MapMarker } from './LazyInteractiveMap';

// Dynamic imports for leaflet to ensure code-splitting
const loadLeaflet = async () => {
    const [L, ReactLeaflet] = await Promise.all([
        import('leaflet'),
        import('react-leaflet')
    ]);

    // Load CSS dynamically
    await import('leaflet/dist/leaflet.css');

    return { L, ReactLeaflet };
};

const DEFAULT_ICON = {
    iconUrl:
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNy41ODIgMiA0IDUuNTgyIDQgMTBDNCAxNi4wNzMgOS4wNzMgMjIgMTIgMjJDMjIgMjIgMjAgMTYgMjAgMTBDMjAgNS41ODIgMTYuNDE4IDIgMTIgMlpNMTIgMTNDMTMuNjU2OSAxMyAxNSAxMS42NTY5IDE1IDEwQzE1IDguMzQzMTUgMTMuNjU2OSA3IDEyIDdDMTAuMzQzMSA3IDkgOC4zNDMxNSA5IDEwQzkgMTEuNjU2OSAxMC4zNDMxIDEzIDEyIDEzWiIgZmlsbD0iIzAwNzc5NiIvPgo8L3N2Zz4K',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
};

interface LeafletMapProps {
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

export default function LeafletMap({
    center,
    zoom = 13,
    markers = [],
    onMarkerClick,
    onMapClick,
    className = '',
    height = '100%',
    interactive = true,
    clusterMarkers = true,
}: LeafletMapProps): React.JSX.Element {
    const [mapComponents, setMapComponents] = useState<{
        L: any;
        ReactLeaflet: any;
    } | null>(null);

    useEffect(() => {
        loadLeaflet().then(({ L, ReactLeaflet }) => {
            setMapComponents({ L, ReactLeaflet });
        });
    }, []);

    if (!mapComponents) {
        return (
            <div className="flex items-center justify-center h-full bg-muted/20">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const { L, ReactLeaflet } = mapComponents;
    const { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } = ReactLeaflet;

    // Create default icon
    const defaultIcon = useMemo(() => L.icon(DEFAULT_ICON), [L]);

    function MapController({
        center: mapCenter,
        zoom: mapZoom,
        onMapClick: handleMapClick,
    }: {
        center: Location;
        zoom: number;
        onMapClick?: (location: Location) => void;
    }): null {
        const map = useMap();

        useEffect(() => {
            map.setView([mapCenter.lat, mapCenter.lng], mapZoom);
        }, [map, mapCenter.lat, mapCenter.lng, mapZoom]);

        useMapEvents({
            click: (event: any) => {
                if (!isTruthy(handleMapClick)) return;
                handleMapClick({
                    lat: event.latlng.lat,
                    lng: event.latlng.lng,
                });
            },
        });

        return null;
    }

    const clusteredMarkers = useMemo(() => {
        if (!clusterMarkers || markers.length === 0) return markers;

        const clusters: MapMarker[] = [];
        const processed = new Set<string>();
        const clusterRadius = 0.01;

        markers.forEach((marker) => {
            if (processed.has(marker.id)) return;

            const nearby = markers.filter((m) => {
                if (processed.has(m.id)) return false;
                const latDiff = Math.abs(m.location.lat - marker.location.lat);
                const lngDiff = Math.abs(m.location.lng - marker.location.lng);
                return latDiff < clusterRadius && lngDiff < clusterRadius;
            });

            if (nearby.length > 1) {
                const clusterCenter: Location = {
                    lat: nearby.reduce((sum, m) => sum + m.location.lat, 0) / nearby.length,
                    lng: nearby.reduce((sum, m) => sum + m.location.lng, 0) / nearby.length,
                };

                clusters.push({
                    id: `cluster-${String(marker.id ?? '')}`,
                    location: clusterCenter,
                    data: nearby,
                    icon: L.divIcon({
                        className: 'custom-cluster-icon',
                        html: `<div class="cluster-marker">${String(nearby.length ?? '')}</div>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20],
                    }),
                });

                nearby.forEach((m) => processed.add(m.id));
            } else {
                clusters.push(marker);
                processed.add(marker.id);
            }
        });

        return clusters;
    }, [markers, clusterMarkers, L]);

    return (
        <div className={`relative ${String(className ?? '')}`} style={{ height }}>
            <style>{`
        .leaflet-container {
          font-family: inherit;
          z-index: 0;
        }
        .cluster-marker {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .custom-cluster-icon {
          background: transparent;
          border: none;
        }
      `}</style>
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={interactive}
                zoomControl={interactive}
                dragging={interactive}
                touchZoom={interactive}
                doubleClickZoom={interactive}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController
                    center={center}
                    zoom={zoom}
                    {...(onMapClick ? { onMapClick } : {})}
                />
                {clusteredMarkers.map((marker) => (
                    <Marker
                        key={marker.id}
                        position={[marker.location.lat, marker.location.lng]}
                        icon={marker.icon ?? defaultIcon}
                        eventHandlers={{
                            click: () => {
                                if (isTruthy(onMarkerClick)) {
                                    onMarkerClick(marker);
                                }
                            },
                        }}
                    >
                        {marker.popup ? <Popup>{marker.popup}</Popup> : null}
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
