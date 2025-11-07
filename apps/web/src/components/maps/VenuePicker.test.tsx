import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import VenuePicker from './VenuePicker';

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

