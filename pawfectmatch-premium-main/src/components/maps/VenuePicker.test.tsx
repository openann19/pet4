import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import VenuePicker from './VenuePicker';
import type { Location, Place } from '@/lib/maps/types';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: () => <div data-testid="marker" />,
  useMap: () => ({
    setView: vi.fn(),
  }),
  useMapEvents: () => ({}),
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
  },
}));

describe('VenuePicker', () => {
  const mockPlace: Place = {
    id: '1',
    name: 'Test Park',
    category: 'park',
    location: { lat: 40.7128, lng: -74.006 },
    address: '123 Test St',
    photos: [],
    verified: true,
    petFriendly: true,
    rating: 4.5,
    reviewCount: 10,
    amenities: [],
    moderationStatus: 'approved',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <VenuePicker
        open={true}
        onClose={vi.fn()}
        onSelectVenue={vi.fn()}
      />
    );
    expect(screen.getByText(/choose a place/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <VenuePicker
        open={false}
        onClose={vi.fn()}
        onSelectVenue={vi.fn()}
      />
    );
    expect(container.querySelector('[data-testid="map-container"]')).not.toBeInTheDocument();
  });
});

