import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CreateLostAlertDialog, type CreateLostAlertDialogProps } from '@/components/lost-found/CreateLostAlertDialog';
import { UIProvider } from '@/contexts/UIContext';

const bounceHandlers: Array<() => void> = [];

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

vi.mock('@/effects/reanimated/use-staggered-item', () => ({
  useStaggeredItem: () => ({
    itemStyle: { opacity: 1, transform: [{ translateY: 0 }] },
  }),
}));

vi.mock('@/effects/reanimated/use-bounce-on-tap', () => ({
  useBounceOnTap: ({ onPress }: { onPress?: () => void } = {}) => {
    const handlePress = onPress ?? vi.fn();
    bounceHandlers.push(handlePress);
    return {
      animatedStyle: { transform: [{ scale: 1 }] },
      handlePress,
    };
  },
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

const renderDialog = (props?: Partial<CreateLostAlertDialogProps>) => {
  const defaultProps: CreateLostAlertDialogProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  const merged = { ...defaultProps, ...props };
  return render(
    <UIProvider>
      <CreateLostAlertDialog {...merged} />
    </UIProvider>
  );
};

describe('CreateLostAlertDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    bounceHandlers.length = 0;
  });

  describe('Rendering', () => {
    it('should render dialog when open', () => {
      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      expect(screen.getByText('Report Lost Pet')).toBeInTheDocument();
      expect(screen.getByText(/Help us help you find your pet/)).toBeInTheDocument();
    });

    it('should not render dialog when closed', () => {
      renderDialog({ open: false, onClose: mockOnClose, onSuccess: mockOnSuccess });

      expect(screen.queryByText('Report Lost Pet')).not.toBeInTheDocument();
    });

    it('should render all form sections', () => {
      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      expect(screen.getByText('Pet Information')).toBeInTheDocument();
      expect(screen.getByText('Last Seen Information')).toBeInTheDocument();
      expect(screen.getByText('Contact & Reward')).toBeInTheDocument();
    });

    it('should render all required fields', () => {
      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

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
      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      const petNameInput = screen.getByLabelText(/Pet Name \*/);
      await user.type(petNameInput, 'Max');

      expect(petNameInput).toHaveValue('Max');
    });

    it('should update species when select changes', async () => {
      const user = userEvent.setup();
      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      const speciesSelect = screen.getByLabelText(/Species \*/);
      await user.click(speciesSelect);
      const catOption = await screen.findByRole('option', { name: 'Cat' });
      await user.click(catOption);

      expect(speciesSelect).toHaveTextContent('Cat');
    });

    it('should add distinctive feature when Add button is clicked', async () => {
      const user = userEvent.setup();
      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

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
      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

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

      const removeButton = await screen.findByRole('button', {
        name: /Remove feature White spot/i,
      });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('White spot')).not.toBeInTheDocument();
      });
    });
  });

  describe('Map Location Picker', () => {
    it('should show map picker when Pick Location button is clicked', async () => {
      const user = userEvent.setup();
      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      const pickLocationButton = screen.getByRole('button', { name: /Pick Location on Map/i });
      await user.click(pickLocationButton);

      await screen.findByRole('heading', { name: 'Pick Location on Map' });
    });

    it('should update location when location is selected', async () => {
      const user = userEvent.setup();
      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      const pickLocationButton = screen.getByRole('button', { name: /Pick Location on Map/i });
      await user.click(pickLocationButton);

      const confirmButton = await screen.findByRole('button', { name: /Confirm Location/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Location set: 37\.7749, -122\.4194/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when form is invalid', () => {
      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      const submitButton = screen.getByRole('button', { name: /Create Alert/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when all required fields are filled', async () => {
      const user = userEvent.setup();
      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      await user.type(screen.getByLabelText(/Pet Name \*/), 'Max');
      await user.type(screen.getByLabelText(/Date \*/), '2024-01-15');
      await user.type(screen.getByLabelText(/Time \*/), '10:00');
      await user.type(screen.getByLabelText(/Contact Information \*/), 'test@example.com');

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Create Alert/i });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show error toast when submitting invalid form', async () => {
      const { toast } = await import('sonner');

      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      const submitHandler = bounceHandlers[bounceHandlers.length - 1];
      expect(submitHandler).toBeDefined();
      submitHandler?.();

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

      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      await user.type(screen.getByLabelText(/Pet Name \*/), 'Max');
      await user.type(screen.getByLabelText(/Date \*/), '2024-01-15');
      await user.type(screen.getByLabelText(/Time \*/), '10:00');
      await user.type(screen.getByLabelText(/Contact Information \*/), 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Create Alert/i });
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

      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      await user.type(screen.getByLabelText(/Pet Name \*/), 'Max');
      await user.type(screen.getByLabelText(/Date \*/), '2024-01-15');
      await user.type(screen.getByLabelText(/Time \*/), '10:00');
      await user.type(screen.getByLabelText(/Contact Information \*/), 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Create Alert/i });
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

      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      await user.type(screen.getByLabelText(/Pet Name \*/), 'Max');
      await user.type(screen.getByLabelText(/Date \*/), '2024-01-15');
      await user.type(screen.getByLabelText(/Time \*/), '10:00');
      await user.type(screen.getByLabelText(/Contact Information \*/), 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Create Alert/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please log in to create a lost alert');
      });
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderDialog({ open: true, onClose: mockOnClose, onSuccess: mockOnSuccess });

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
