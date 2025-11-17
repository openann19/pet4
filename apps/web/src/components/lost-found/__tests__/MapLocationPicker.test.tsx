import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MapLocationPicker } from '@/components/lost-found/MapLocationPicker';

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children: React.ReactNode;[key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  useAnimatedStyleValue: vi.fn((style: unknown) => {
    if (typeof style === 'function') {
      try {
        return style();
      } catch {
        return {};
      }
    }
    return style || {};
  }),
}));

vi.mock('@/effects/reanimated/use-modal-animation', () => ({
  useModalAnimation: () => ({
    style: { opacity: 1, transform: [{ scale: 1 }, { translateY: 0 }] },
  }),
}));

vi.mock('@/effects/reanimated/use-bounce-on-tap', () => ({
  usePressBounce: ({ onPress }: { onPress?: () => void }) => ({
    animatedStyle: { transform: [{ scale: 1 }] },
    handlePress: onPress ?? vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

global.fetch = vi.fn();

describe('MapLocationPicker', () => {
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGeolocation.getCurrentPosition.mockClear();
    vi.mocked(global.fetch).mockClear();
  });

  describe('Rendering', () => {
    it('should render map location picker with default location', () => {
      render(<MapLocationPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

      expect(screen.getByText('Pick Location on Map')).toBeInTheDocument();
      expect(screen.getByText(/Drag the map or use current location/)).toBeInTheDocument();
      expect(screen.getByText(/Lat: 37\.774900/)).toBeInTheDocument();
      expect(screen.getByText(/Lon: -122\.419400/)).toBeInTheDocument();
    });

    it('should render with initial location when provided', () => {
      const initialLocation = { lat: 40.7128, lon: -74.006 };
      render(
        <MapLocationPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          initialLocation={initialLocation}
        />
      );

      expect(screen.getByText(/Lat: 40\.712800/)).toBeInTheDocument();
      expect(screen.getByText(/Lon: -74\.006000/)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<MapLocationPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

      expect(screen.getByText('Use Current Location')).toBeInTheDocument();
      expect(screen.getByText('Confirm Location')).toBeInTheDocument();
    });
  });

  describe('Geolocation', () => {
    it('should request current location on mount when no initial location', async () => {
      render(<MapLocationPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });

    it('should not request location when initial location is provided', () => {
      const initialLocation = { lat: 40.7128, lon: -74.006 };
      render(
        <MapLocationPicker
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          initialLocation={initialLocation}
        />
      );

      expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
    });

    it('should update location when Use Current Location is clicked', async () => {
      const user = userEvent.setup();
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      render(<MapLocationPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

      const useCurrentLocationButton = screen.getByText('Use Current Location');
      await user.click(useCurrentLocationButton);

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });
  });

  describe('Address Fetching', () => {
    it('should fetch address for selected location', async () => {
      const mockResponse = {
        display_name: 'San Francisco, CA, USA',
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      render(<MapLocationPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('nominatim.openstreetmap.org')
        );
      });
    });

    it('should handle address fetch error gracefully', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      render(<MapLocationPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/Unable to fetch address/)).toBeInTheDocument();
      });
    });

    it('should handle HTTP error response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      render(<MapLocationPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/Unable to fetch address/)).toBeInTheDocument();
      });
    });
  });

  describe('Location Selection', () => {
    it('should call onSelect with correct coordinates when Confirm is clicked', async () => {
      const user = userEvent.setup();
      render(<MapLocationPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

      const confirmButton = screen.getByText('Confirm Location');
      await user.click(confirmButton);

      expect(mockOnSelect).toHaveBeenCalledWith(37.7749, -122.4194);
    });

    it('should call onSelect with updated coordinates after location change', async () => {
      const user = userEvent.setup();
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      render(<MapLocationPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

      const useCurrentLocationButton = screen.getByText('Use Current Location');
      await user.click(useCurrentLocationButton);

      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm Location');
        userEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith(40.7128, -74.006);
      });
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();

      render(<MapLocationPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && svg.getAttribute('viewBox') === '0 0 256 256';
      });

      if (closeButton) {
        await user.click(closeButton);
        vi.advanceTimersByTime(300);
      }

      await waitFor(
        () => {
          expect(mockOnClose).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );

      vi.useRealTimers();
    });
  });

  describe('Loading States', () => {
    it('should disable buttons while loading address', async () => {
      vi.mocked(global.fetch).mockImplementation(() => new Promise(() => { }));

      render(<MapLocationPicker onSelect={mockOnSelect} onClose={mockOnClose} />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const actionButtons = buttons.filter(
          (btn) =>
            btn.textContent?.includes('Use Current Location') ||
            btn.textContent?.includes('Confirm Location')
        );
        actionButtons.forEach((btn) => {
          expect(btn).toBeDisabled();
        });
      });
    });
  });
});
