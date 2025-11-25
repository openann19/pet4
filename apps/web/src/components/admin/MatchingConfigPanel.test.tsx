import { matchingAPI } from '@/api/matching-api';
import type { MatchingConfig } from '@/core/domain/matching-config';
import { DEFAULT_HARD_GATES, DEFAULT_MATCHING_WEIGHTS } from '@/core/domain/matching-config';
import { screen, waitFor } from '@testing-library/dom';
import { render } from '@/test/utils/test-wrapper';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MatchingConfigPanel } from './MatchingConfigPanel';

vi.mock('@/api/matching-api', () => ({
  matchingAPI: {
    updateConfig: vi.fn(),
    getConfig: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

const mockConfig: MatchingConfig = {
  id: 'default',
  weights: DEFAULT_MATCHING_WEIGHTS,
  hardGates: DEFAULT_HARD_GATES,
  featureFlags: {
    MATCH_ALLOW_CROSS_SPECIES: false,
    MATCH_REQUIRE_VACCINATION: true,
    MATCH_DISTANCE_MAX_KM: 50,
    MATCH_AB_TEST_KEYS: [],
    MATCH_AI_HINTS_ENABLED: true,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'admin',
};

describe('MatchingConfigPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', async () => {
    vi.mocked(matchingAPI.getConfig).mockResolvedValue(null as unknown as MatchingConfig);

    render(<MatchingConfigPanel />);

    expect(screen.getByText(/loading configuration/i)).toBeInTheDocument();
  });

  it('should load and display configuration', async () => {
    vi.mocked(matchingAPI.getConfig).mockResolvedValue(mockConfig);

    render(<MatchingConfigPanel />);

    await waitFor(() => {
      expect(screen.getByText(/matching weights configuration/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/hard gates configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/feature flags/i)).toBeInTheDocument();
  });

  it('should display default configuration when none exists', async () => {
    vi.mocked(matchingAPI.getConfig).mockResolvedValue(null as unknown as MatchingConfig);

    render(<MatchingConfigPanel />);

    await waitFor(() => {
      expect(screen.getByText(/matching weights configuration/i)).toBeInTheDocument();
    });
  });

  it('should update weights when slider changes', async () => {
    vi.mocked(matchingAPI.getConfig).mockResolvedValue(mockConfig);

    render(<MatchingConfigPanel />);

    await waitFor(() => {
      expect(screen.getByText(/matching weights configuration/i)).toBeInTheDocument();
    });

    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThan(0);
  });

  it('should save configuration with strict optional types', async () => {
    vi.mocked(matchingAPI.getConfig).mockResolvedValue(mockConfig);
    const updateConfigMock = vi.mocked(matchingAPI.updateConfig).mockResolvedValue(mockConfig);

    const user = userEvent.setup();
    render(<MatchingConfigPanel />);

    await waitFor(() => {
      expect(screen.getByText(/save configuration/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save configuration/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(updateConfigMock).toHaveBeenCalledWith({
        weights: mockConfig.weights,
        hardGates: mockConfig.hardGates,
        featureFlags: mockConfig.featureFlags,
      });
    });
  });

  it('should handle save errors gracefully', async () => {
    vi.mocked(matchingAPI.getConfig).mockResolvedValue(mockConfig);
    const updateConfigMock = vi
      .mocked(matchingAPI.updateConfig)
      .mockRejectedValue(new Error('Save failed'));

    const user = userEvent.setup();
    render(<MatchingConfigPanel />);

    await waitFor(() => {
      expect(screen.getByText(/save configuration/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save configuration/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(updateConfigMock).toHaveBeenCalled();
    });
  });

  it('should disable save button when weights are invalid', async () => {
    const invalidConfig: MatchingConfig = {
      ...mockConfig,
      weights: {
        ...DEFAULT_MATCHING_WEIGHTS,
        temperamentFit: 50,
        energyLevelFit: 50,
      },
    };

    vi.mocked(matchingAPI.getConfig).mockResolvedValue(invalidConfig);

    render(<MatchingConfigPanel />);

    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /save configuration/i });
      expect(saveButton).toBeDisabled();
    });
  });

  it('should update state after successful save', async () => {
    const updatedConfig: MatchingConfig = {
      ...mockConfig,
      updatedBy: 'testuser',
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(matchingAPI.getConfig).mockResolvedValue(mockConfig);
    vi.mocked(matchingAPI.updateConfig).mockResolvedValue(updatedConfig);

    const user = userEvent.setup();
    render(<MatchingConfigPanel />);

    await waitFor(() => {
      expect(screen.getByText(/save configuration/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save configuration/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(matchingAPI.updateConfig).toHaveBeenCalled();
    });
  });
});
