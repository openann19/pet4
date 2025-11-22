/**
 * Consent Banner Tests
 *
 * Unit tests for consent banner component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsentBanner } from '../ConsentBanner';
import * as consentManager from '@/hooks/use-consent-manager';
import * as storage from '@/lib/cache/local-storage';

vi.mock('@/hooks/use-consent-manager');
vi.mock('@/lib/cache/local-storage');

describe('ConsentBanner', () => {
  const mockAcceptConsent = vi.fn();
  const mockRejectConsent = vi.fn();
  const mockConsentManager = {
    preferences: {
      essential: true,
      analytics: false,
      marketing: false,
      thirdParty: false,
    },
    isLoaded: false,
    acceptConsent: mockAcceptConsent,
    rejectConsent: mockRejectConsent,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(consentManager.useConsentManager).mockReturnValue(mockConsentManager as never);
    vi.mocked(storage.getStorageItem).mockReturnValue(null);
    vi.mocked(storage.setStorageItem).mockReturnValue(true);
  });

  it('should not render if banner was dismissed', () => {
    vi.mocked(storage.getStorageItem).mockReturnValue(true);
    const { container } = render(<ConsentBanner showOnMount={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render consent banner on first visit', () => {
    render(<ConsentBanner showOnMount={true} />);
    expect(screen.getByText('Cookie Consent')).toBeInTheDocument();
  });

  it('should handle accept all consent', async () => {
    const user = userEvent.setup();
    render(<ConsentBanner showOnMount={true} />);

    const acceptButton = screen.getByLabelText('Accept all cookies');
    await user.click(acceptButton);

    await waitFor(() => {
      expect(mockAcceptConsent).toHaveBeenCalledWith('analytics');
      expect(mockAcceptConsent).toHaveBeenCalledWith('marketing');
      expect(mockAcceptConsent).toHaveBeenCalledWith('third_party');
    });
  });

  it('should handle reject all consent', async () => {
    const user = userEvent.setup();
    render(<ConsentBanner showOnMount={true} />);

    const rejectButton = screen.getByText('Essential Only');
    await user.click(rejectButton);

    await waitFor(() => {
      expect(mockRejectConsent).toHaveBeenCalledWith('analytics');
      expect(mockRejectConsent).toHaveBeenCalledWith('marketing');
      expect(mockRejectConsent).toHaveBeenCalledWith('third_party');
    });
  });

  it('should show preferences dialog when manage is clicked', async () => {
    const user = userEvent.setup();
    render(<ConsentBanner showOnMount={true} />);

    const manageButton = screen.getByLabelText('Manage cookie preferences');
    await user.click(manageButton);

    await waitFor(() => {
      expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
    });
  });
});

