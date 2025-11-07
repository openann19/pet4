import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocationBubble, LocationPicker } from './LocationSharing';
import type { Location } from '@/lib/maps/types';
import { isTruthy, isDefined } from '@/core/guards';

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
    icon: vi.fn(() => ({})),
  },
}));

describe('LocationSharing', () => {
  const mockLocation: Location = { lat: 40.7128, lng: -74.006 };

  describe('LocationBubble', () => {
    it('renders location bubble', () => {
      render(<LocationBubble location={mockLocation} />);
      expect(screen.getByRole('button', { hidden: true })).toBeInTheDocument();
    });

    it('calls onTap when provided', () => {
      const handleTap = vi.fn();
      const { container } = render(
        <LocationBubble location={mockLocation} onTap={handleTap} />
      );
      const bubble = container.querySelector('.cursor-pointer');
      if (isTruthy(bubble)) {
        (bubble as HTMLElement).click();
      }
      expect(handleTap).toHaveBeenCalled();
    });
  });

  describe('LocationPicker', () => {
    it('renders location picker', () => {
      render(
        <LocationPicker
          onSelectLocation={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText(/share location/i)).toBeInTheDocument();
    });
  });
});

