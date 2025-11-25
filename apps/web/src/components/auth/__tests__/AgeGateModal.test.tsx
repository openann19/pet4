/**
 * AgeGateModal tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import AgeGateModal from '@/components/auth/AgeGateModal';
import type { AgeVerification } from '@/lib/kyc-types';
import { UIProvider } from '@/contexts/UIContext';

// Mock dependencies
const mockTranslations = {
  auth: {
    birthDate: 'Date of Birth',
    birthDateRequired: 'Please enter your birth date',
    ageTooYoung: 'You must be at least 18 years old to use this app',
    verificationError: 'Verification failed. Please try again.',
    verify: 'Verify',
    verifyAge: 'Verify Age',
    enterBirthDate: 'Enter your birth date',
    country: 'Country (Optional)',
    countryPlaceholder: 'e.g., United States',
    ageVerificationTitle: 'Age Verification',
    ageVerificationDesc: 'You must be at least 18 years old to use PawfectMatch.',
  },
  common: {
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    save: 'Save',
    loading: 'Loading...',
    error: 'Error',
  },
};

vi.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    t: mockTranslations,
  }),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(() => undefined),
    trigger: vi.fn(() => undefined),
    light: vi.fn(() => undefined),
    medium: vi.fn(() => undefined),
    heavy: vi.fn(() => undefined),
    selection: vi.fn(() => undefined),
    success: vi.fn(() => undefined),
    warning: vi.fn(() => undefined),
    error: vi.fn(() => undefined),
    notification: vi.fn(() => undefined),
    isHapticSupported: vi.fn(() => false),
  },
  triggerHaptic: vi.fn(() => undefined),
}));

vi.mock('@/lib/kyc-service', () => ({
  recordAgeVerification: vi.fn().mockResolvedValue({
    userId: 'user-1',
    ageVerified: true,
    verifiedAt: new Date().toISOString(),
  } as AgeVerification),
}));

// Mock useStorage hook
vi.mock('@/hooks/use-storage', () => ({
  useStorage: vi.fn(() => {
    const setValue = vi.fn().mockResolvedValue(undefined);
    const deleteValue = vi.fn().mockResolvedValue(undefined);
    return ['user-1', setValue, deleteValue];
  }),
}));



describe('AgeGateModal', () => {
  const mockOnVerified = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithUI = (props: Partial<ComponentProps<typeof AgeGateModal>> = {}) => {
    return render(
      <UIProvider>
        <AgeGateModal
          open={true}
          onVerified={mockOnVerified}
          onClose={mockOnClose}
          {...props}
        />
      </UIProvider>
    );
  };

  it('should not render when closed', () => {
    renderWithUI({ open: false });

    expect(screen.queryByText(/enter your birth date/i)).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    renderWithUI();

    expect(screen.getByText(/enter your birth date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/birth date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify age/i })).toBeInTheDocument();
  });

  it('should show error when birth date is not provided', async () => {
    const user = userEvent.setup();
    renderWithUI();

    const verifyButton = screen.getByRole('button', { name: /verify age/i });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter your birth date')).toBeInTheDocument();
    });
  });

  it('should show error when user is too young', async () => {
    const user = userEvent.setup();
    renderWithUI();

    // Set birth date to 5 years ago (too young)
    const birthDateInput = screen.getByLabelText(/birth date/i);
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const dateString = fiveYearsAgo.toISOString().split('T')[0];
    if (!dateString) {
      throw new Error('Failed to generate date string');
    }

    await user.type(birthDateInput, dateString);
    await user.click(screen.getByRole('button', { name: /verify age/i }));

    await waitFor(() => {
      const errorMessage = screen.getByText(/you must be at least 18 years old/i);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.textContent ?? '').toContain('18 years old');
    });
  });

  it('should verify age successfully when user is 18 or older', async () => {
    const user = userEvent.setup();
    const { recordAgeVerification } = await import('@/lib/kyc-service');
    vi.mocked(recordAgeVerification).mockResolvedValue({
      userId: 'user-1',
      ageVerified: true,
      verifiedAt: new Date().toISOString(),
    } as AgeVerification);

    renderWithUI();

    // Set birth date to 20 years ago (old enough)
    const birthDateInput = screen.getByLabelText(/birth date/i);
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    const dateString = twentyYearsAgo.toISOString().split('T')[0];
    if (!dateString) {
      throw new Error('Failed to generate date string');
    }

    await user.type(birthDateInput, dateString);
    await user.click(screen.getByRole('button', { name: /verify age/i }));

    await waitFor(() => {
      expect(recordAgeVerification).toHaveBeenCalledWith('user-1', true, undefined);
      expect(mockOnVerified).toHaveBeenCalled();
    });
  });

  it('should include country when provided', async () => {
    const user = userEvent.setup();
    const { recordAgeVerification } = await import('@/lib/kyc-service');
    vi.mocked(recordAgeVerification).mockResolvedValue({
      userId: 'user-1',
      ageVerified: true,
      verifiedAt: new Date().toISOString(),
      country: 'US',
    } as AgeVerification);

    renderWithUI();

    const birthDateInput = screen.getByLabelText(/birth date/i);
    const countryInput = screen.getByLabelText(/country/i);

    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    const dateString = twentyYearsAgo.toISOString().split('T')[0];
    if (!dateString) {
      throw new Error('Failed to generate date string');
    }

    await user.type(birthDateInput, dateString);
    await user.type(countryInput, 'US');
    await user.click(screen.getByRole('button', { name: /verify age/i }));

    await waitFor(() => {
      expect(recordAgeVerification).toHaveBeenCalledWith('user-1', true, 'US');
    });
  });

  it('should handle verification error', async () => {
    const user = userEvent.setup();
    const { recordAgeVerification } = await import('@/lib/kyc-service');
    vi.mocked(recordAgeVerification).mockRejectedValue(new Error('Verification failed'));

    renderWithUI();

    const birthDateInput = screen.getByLabelText(/birth date/i);
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    const dateString = twentyYearsAgo.toISOString().split('T')[0];
    if (!dateString) {
      throw new Error('Failed to generate date string');
    }

    await user.type(birthDateInput, dateString);
    await user.click(screen.getByRole('button', { name: /verify age/i }));

    await waitFor(() => {
      expect(screen.getByText('Verification failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<AgeGateModal open={true} onVerified={mockOnVerified} onClose={mockOnClose} />);

    // The close button uses t.common.cancel which is 'Cancel'
    const closeButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
vi.mock('@petspark/motion', () => {
  const MotionComponent = ({
    children,
    ...props
  }: { children?: ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  );

  return {
    MotionView: MotionComponent,
    Presence: ({ children }: { children?: ReactNode }) => <>{children}</>,
    motion: {
      div: MotionComponent,
      button: MotionComponent,
      span: MotionComponent,
    },
    Animated: {
      View: MotionComponent,
      Text: MotionComponent,
    },
  };
});
