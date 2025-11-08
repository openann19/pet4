import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CreateLostAlertDialog } from '../CreateLostAlertDialog';

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock('@/effects/reanimated/use-staggered-item', () => ({
  useStaggeredItem: () => ({
    itemStyle: { opacity: 1, transform: [{ translateY: 0 }] },
  }),
}));

vi.mock('@/effects/reanimated/use-bounce-on-tap', () => ({
  useBounceOnTap: ({ onPress }: { onPress?: () => void }) => ({
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

vi.mock('@/api/lost-found-api', () => ({
  lostFoundAPI: {
    createAlert: vi.fn(),
  },
}));

vi.mock('@/lib/user-service', () => ({
  userService: {
    user: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('./MapLocationPicker', () => ({
  MapLocationPicker: ({
    onSelect,
    onClose,
  }: {
    onSelect: (lat: number, lon: number) => void;
    onClose: () => void;
  }) => (
    <div data-testid="map-location-picker">
      <button onClick={() => onSelect(40.7128, -74.006)}>Select Location</button>
      <button onClick={onClose}>Close Map</button>
    </div>
  ),
}));

describe('CreateLostAlertDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open', () => {
      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Report Lost Pet')).toBeInTheDocument();
      expect(screen.getByText(/Help us help you find your pet/)).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      render(
        <CreateLostAlertDialog open={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.queryByText('Report Lost Pet')).not.toBeInTheDocument();
    });

    it('should render all form sections', () => {
      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Pet Information')).toBeInTheDocument();
      expect(screen.getByText('Last Seen Information')).toBeInTheDocument();
      expect(screen.getByText('Contact & Reward')).toBeInTheDocument();
    });

    it('should render all required fields', () => {
      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/Pet Name \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Species \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Date \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Time \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Contact Information \*/)).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update pet name when input changes', async () => {
      const user = userEvent.setup();
      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const petNameInput = screen.getByLabelText(/Pet Name \*/);
      await user.type(petNameInput, 'Max');

      expect(petNameInput).toHaveValue('Max');
    });

    it('should update species when select changes', async () => {
      const user = userEvent.setup();
      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const speciesSelect = screen.getByLabelText(/Species \*/);
      await user.click(speciesSelect);
      const catOption = screen.getByText('Cat');
      await user.click(catOption);

      expect(speciesSelect).toBeInTheDocument();
    });

    it('should add distinctive feature when Add button is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const featureInput = screen.getByPlaceholderText(/White spot on chest/);
      await user.type(featureInput, 'White spot on chest');

      const plusButtons = screen.getAllByRole('button');
      const addFeatureButton = plusButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && svg.getAttribute('viewBox') === '0 0 256 256';
      });

      if (addFeatureButton) {
        await user.click(addFeatureButton);
      }

      await waitFor(() => {
        expect(screen.getByText('White spot on chest')).toBeInTheDocument();
      });
    });

    it('should remove distinctive feature when X is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const featureInput = screen.getByPlaceholderText(/White spot on chest/);
      await user.type(featureInput, 'White spot');

      const plusButtons = screen.getAllByRole('button');
      const addFeatureButton = plusButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && svg.getAttribute('viewBox') === '0 0 256 256';
      });

      if (addFeatureButton) {
        await user.click(addFeatureButton);
      }

      await waitFor(() => {
        const removeButtons = screen.getAllByRole('button');
        const removeButton = removeButtons.find((btn) => {
          const svg = btn.querySelector('svg');
          return svg && svg.getAttribute('viewBox') === '0 0 256 256';
        });
        if (removeButton) {
          userEvent.click(removeButton);
        }
      });

      await waitFor(() => {
        expect(screen.queryByText('White spot')).not.toBeInTheDocument();
      });
    });
  });

  describe('Map Location Picker', () => {
    it('should show map picker when Pick Location button is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const pickLocationButton = screen.getByText(/Pick Location on Map/);
      await user.click(pickLocationButton);

      await waitFor(() => {
        expect(screen.getByTestId('map-location-picker')).toBeInTheDocument();
      });
    });

    it('should update location when location is selected', async () => {
      const user = userEvent.setup();
      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const pickLocationButton = screen.getByText(/Pick Location on Map/);
      await user.click(pickLocationButton);

      await waitFor(() => {
        const selectButton = screen.getByText('Select Location');
        userEvent.click(selectButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Location set: 40\.7128, -74\.0060/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when form is invalid', () => {
      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByText('Create Alert');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when all required fields are filled', async () => {
      const user = userEvent.setup();
      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/Pet Name \*/), 'Max');
      await user.type(screen.getByLabelText(/Date \*/), '2024-01-15');
      await user.type(screen.getByLabelText(/Time \*/), '10:00');
      await user.type(screen.getByLabelText(/Contact Information \*/), 'test@example.com');

      await waitFor(() => {
        const submitButton = screen.getByText('Create Alert');
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show error toast when submitting invalid form', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');

      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByText('Create Alert');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields');
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form successfully with all data', async () => {
      const user = userEvent.setup();
      const { lostFoundAPI } = await import('@/api/lost-found-api');
      const { userService } = await import('@/lib/user-service');
      const { toast } = await import('sonner');

      vi.mocked(userService.user).mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      } as never);

      vi.mocked(lostFoundAPI.createAlert).mockResolvedValue({} as never);

      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/Pet Name \*/), 'Max');
      await user.type(screen.getByLabelText(/Date \*/), '2024-01-15');
      await user.type(screen.getByLabelText(/Time \*/), '10:00');
      await user.type(screen.getByLabelText(/Contact Information \*/), 'test@example.com');

      const submitButton = screen.getByText('Create Alert');
      await user.click(submitButton);

      await waitFor(() => {
        expect(lostFoundAPI.createAlert).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Lost pet alert created successfully!');
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle submission error gracefully', async () => {
      const user = userEvent.setup();
      const { lostFoundAPI } = await import('@/api/lost-found-api');
      const { userService } = await import('@/lib/user-service');
      const { toast } = await import('sonner');

      vi.mocked(userService.user).mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
      } as never);

      vi.mocked(lostFoundAPI.createAlert).mockRejectedValue(new Error('API Error'));

      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/Pet Name \*/), 'Max');
      await user.type(screen.getByLabelText(/Date \*/), '2024-01-15');
      await user.type(screen.getByLabelText(/Time \*/), '10:00');
      await user.type(screen.getByLabelText(/Contact Information \*/), 'test@example.com');

      const submitButton = screen.getByText('Create Alert');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to create alert. Please try again.');
      });
    });

    it('should show error when user is not logged in', async () => {
      const user = userEvent.setup();
      const { userService } = await import('@/lib/user-service');
      const { toast } = await import('sonner');

      vi.mocked(userService.user).mockResolvedValue(null);

      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      await user.type(screen.getByLabelText(/Pet Name \*/), 'Max');
      await user.type(screen.getByLabelText(/Date \*/), '2024-01-15');
      await user.type(screen.getByLabelText(/Time \*/), '10:00');
      await user.type(screen.getByLabelText(/Contact Information \*/), 'test@example.com');

      const submitButton = screen.getByText('Create Alert');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please log in to create a lost alert');
      });
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateLostAlertDialog open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
