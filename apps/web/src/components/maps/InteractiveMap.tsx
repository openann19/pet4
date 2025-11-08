import type { Location } from '@/lib/maps/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

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
  icon?: L.Icon | L.DivIcon;
  popup?: React.ReactNode;
}

const DEFAULT_ICON = L.icon({
  iconUrl:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNy41ODIgMiA0IDUuNTgyIDQgMTBDNCAxNi4wNzMgOS4wNzMgMjIgMTIgMjJDMjIgMjIgMjAgMTYgMjAgMTBDMjAgNS41ODIgMTYuNDE4IDIgMTIgMlpNMTIgMTNDMTMuNjU2OSAxMyAxNSAxMS42NTY5IDE1IDEwQzE1IDguMzQzMTUgMTMuNjU2OSA3IDEyIDdDMTAuMzQzMSA3IDkgOC4zNDMxNSA5IDEwQzkgMTEuNjU2OSAxMC4zNDMxIDEzIDEyIDEzWiIgZmlsbD0iIzAwNzc5NiIvPgo8L3N2Zz4K',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function MapController({
  center,
  zoom,
  onMapClick,
}: {
  center: Location;
  zoom: number;
  onMapClick?: (location: Location) => void;
}): null {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [map, center.lat, center.lng, zoom]);

  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
      }
    },
  });

  return null;
}

export default function InteractiveMap({
  center,
  zoom = 13,
  markers = [],
  onMarkerClick,
  onMapClick,
  className = '',
  height = '100%',
  interactive = true,
  clusterMarkers = true,
}: InteractiveMapProps): React.JSX.Element {
  const mapRef = useRef<L.Map | null>(null);

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
          id: `cluster-${marker.id}`,
          location: clusterCenter,
          data: nearby,
          icon: L.divIcon({
            className: 'custom-cluster-icon',
            html: `<div class="cluster-marker">${nearby.length}</div>`,
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
  }, [markers, clusterMarkers]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
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
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} {...(onMapClick ? { onMapClick } : {})} />
        {clusteredMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.location.lat, marker.location.lng]}
            icon={marker.icon || DEFAULT_ICON}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(marker);
                }
              },
            }}
          >
            {marker.popup ? <Popup>{String(marker.popup)}</Popup> : null}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
