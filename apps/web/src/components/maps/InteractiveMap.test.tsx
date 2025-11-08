import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import InteractiveMap, { type MapMarker } from './InteractiveMap';
import type { Location } from '@/lib/maps/types';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ position }: { position: [number, number] }) => (
    <div data-testid={`marker-${position[0]}-${position[1]}`} />
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    setView: vi.fn(),
  }),
  useMapEvents: () => ({}),
}));

vi.mock('leaflet', () => ({
  default: {
    icon: vi.fn(() => ({})),
    divIcon: vi.fn(() => ({})),
  },
}));

describe('InteractiveMap', () => {
  const defaultCenter: Location = { lat: 40.7128, lng: -74.006 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders map container', () => {
    render(<InteractiveMap center={defaultCenter} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders tile layer', () => {
    render(<InteractiveMap center={defaultCenter} />);
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  it('renders markers', () => {
    const markers: MapMarker[] = [
      {
        id: '1',
        location: { lat: 40.7128, lng: -74.006 },
        data: {},
      },
      {
        id: '2',
        location: { lat: 40.7589, lng: -73.9851 },
        data: {},
      },
    ];

    render(<InteractiveMap center={defaultCenter} markers={markers} />);
    expect(screen.getByTestId('marker-40.7128--74.006')).toBeInTheDocument();
    expect(screen.getByTestId('marker-40.7589--73.9851')).toBeInTheDocument();
  });

  it('clusters nearby markers', () => {
    const markers: MapMarker[] = [
      {
        id: '1',
        location: { lat: 40.7128, lng: -74.006 },
        data: {},
      },
      {
        id: '2',
        location: { lat: 40.7129, lng: -74.0061 },
        data: {},
      },
    ];

    const { container } = render(
      <InteractiveMap center={defaultCenter} markers={markers} clusterMarkers />
    );
    expect(container).toBeInTheDocument();
  });

  it('applies custom height', () => {
    const { container } = render(<InteractiveMap center={defaultCenter} height="500px" />);
    const mapDiv = container.querySelector('.relative');
    expect(mapDiv).toHaveStyle({ height: '500px' });
  });
});
