import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsView from '../SettingsView';
import { useStorage } from '@/hooks/use-storage';
import { triggerHaptic } from '@/lib/haptics';

vi.mock('@/hooks/use-storage');
vi.mock('@/lib/haptics', () => ({
  triggerHaptic: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockUseStorage = vi.mocked(useStorage);
const mockTriggerHaptic = vi.mocked(triggerHaptic);

describe('SettingsView', () => {
  const mockSetFeatureFlags = vi.fn();
  const mockSetSystemSettings = vi.fn();

  const defaultFeatureFlags = {
    enableChat: true,
    enableVisualAnalysis: true,
    enableMatching: true,
    enableReporting: true,
    enableVerification: true,
  };

  const defaultSystemSettings = {
    maxReportsPerUser: 10,
    autoModeration: false,
    requireVerification: false,
    matchDistanceRadius: 50,
    messagingEnabled: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'admin-feature-flags') {
        return [defaultFeatureFlags, mockSetFeatureFlags, vi.fn()];
      }
      if (key === 'admin-system-settings') {
        return [defaultSystemSettings, mockSetSystemSettings, vi.fn()];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });
  });

  it('renders settings view', () => {
    render(<SettingsView />);

    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it('displays feature flags', () => {
    render(<SettingsView />);

    expect(screen.getByText(/feature flags/i)).toBeInTheDocument();
  });

  it('displays system settings', () => {
    render(<SettingsView />);

    expect(screen.getByText(/system settings/i)).toBeInTheDocument();
  });

  it('toggles feature flag', async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    const switches = screen.getAllByRole('switch');
    const firstSwitch = switches[0];
    if (firstSwitch) {
      await user.click(firstSwitch);
    }

    expect(mockSetFeatureFlags).toHaveBeenCalled();
    expect(mockTriggerHaptic).toHaveBeenCalledWith('selection');
  });

  it('updates system setting slider', async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    const sliders = screen.getAllByRole('slider');
    const firstSlider = sliders[0];
    if (firstSlider) {
      await user.click(firstSlider);
    }
  });

  it('toggles system setting switch', async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    const switches = screen.getAllByRole('switch');
    const lastSwitch = switches[switches.length - 1];
    if (lastSwitch) {
      await user.click(lastSwitch);
    }

    expect(mockSetSystemSettings).toHaveBeenCalled();
  });

  it('handles null feature flags gracefully', () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'admin-feature-flags') {
        return [null, mockSetFeatureFlags, vi.fn()];
      }
      if (key === 'admin-system-settings') {
        return [defaultSystemSettings, mockSetSystemSettings, vi.fn()];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });

    render(<SettingsView />);

    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it('handles null system settings gracefully', () => {
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'admin-feature-flags') {
        return [defaultFeatureFlags, mockSetFeatureFlags, vi.fn()];
      }
      if (key === 'admin-system-settings') {
        return [null, mockSetSystemSettings, vi.fn()];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });

    render(<SettingsView />);

    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it('handles error when updating feature flag', async () => {
    const user = userEvent.setup();
    mockSetFeatureFlags.mockImplementation(() => {
      throw new Error('Update failed');
    });

    render(<SettingsView />);

    const switches = screen.getAllByRole('switch');
    const firstSwitch = switches[0];
    if (firstSwitch) {
      await user.click(firstSwitch);
    }
  });

  it('handles error when updating system setting', async () => {
    const user = userEvent.setup();
    mockSetSystemSettings.mockImplementation(() => {
      throw new Error('Update failed');
    });

    render(<SettingsView />);

    const switches = screen.getAllByRole('switch');
    const lastSwitch = switches[switches.length - 1];
    if (lastSwitch) {
      await user.click(lastSwitch);
    }
  });

  it('displays all feature flag switches', () => {
    render(<SettingsView />);

    expect(screen.getByText(/enable chat/i)).toBeInTheDocument();
    expect(screen.getByText(/enable visual analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/enable matching/i)).toBeInTheDocument();
  });

  it('displays all system setting controls', () => {
    render(<SettingsView />);

    expect(screen.getByText(/max reports per user/i)).toBeInTheDocument();
    expect(screen.getByText(/match distance radius/i)).toBeInTheDocument();
  });
});
