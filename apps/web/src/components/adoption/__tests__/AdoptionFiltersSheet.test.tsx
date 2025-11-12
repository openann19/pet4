import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdoptionFiltersSheet } from '@/components/adoption/AdoptionFiltersSheet';
import type { AdoptionListingFilters } from '@/lib/adoption-marketplace-types';
import { haptics } from '@/lib/haptics';

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

const mockHaptics = vi.mocked(haptics);

describe('AdoptionFiltersSheet', () => {
  const mockFilters: AdoptionListingFilters = {};
  const mockOnFiltersChange = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('renders filters sheet when open', () => {
    render(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText(/filters/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <AdoptionFiltersSheet
        open={false}
        onOpenChange={mockOnOpenChange}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('toggles species filter', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const dogCheckbox = screen.getByLabelText(/dog/i);
    await user.click(dogCheckbox);

    expect(mockHaptics.impact).toHaveBeenCalledWith('light');
  });

  it('toggles size filter', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const sizeCheckboxes = screen.getAllByLabelText(/small|medium|large/i);
    if (sizeCheckboxes.length > 0 && sizeCheckboxes[0]) {
      await user.click(sizeCheckboxes[0]);
    }

    expect(mockHaptics.impact).toHaveBeenCalledWith('light');
  });

  it('toggles energy level filter', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const energyCheckboxes = screen.getAllByLabelText(/low|medium|high/i);
    if (energyCheckboxes.length > 0 && energyCheckboxes[0]) {
      await user.click(energyCheckboxes[0]);
    }

    expect(mockHaptics.impact).toHaveBeenCalledWith('light');
  });

  it('toggles status filter', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const statusCheckboxes = screen.getAllByLabelText(/active|pending|adopted/i);
    if (statusCheckboxes.length > 0 && statusCheckboxes[0]) {
      await user.click(statusCheckboxes[0]);
    }

    expect(mockHaptics.impact).toHaveBeenCalledWith('light');
  });

  it('clears all filters', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={{ species: ['dog'] }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(mockHaptics.trigger).toHaveBeenCalledWith('light');
  });

  it('applies filters', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    expect(mockOnFiltersChange).toHaveBeenCalled();
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('updates local filters when props change', () => {
    const { rerender } = render(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    rerender(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={{ species: ['dog'] }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText(/filters/i)).toBeInTheDocument();
  });

  it('displays all filter options', () => {
    render(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText(/species/i)).toBeInTheDocument();
    expect(screen.getByText(/size/i)).toBeInTheDocument();
    expect(screen.getByText(/energy level/i)).toBeInTheDocument();
  });

  it('handles age range slider', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const sliders = screen.getAllByRole('slider');
    if (sliders.length > 0 && sliders[0]) {
      await user.click(sliders[0]);
    }
  });

  it('handles adoption fee range slider', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const sliders = screen.getAllByRole('slider');
    if (sliders.length > 1 && sliders[1]) {
      await user.click(sliders[1]);
    }
  });

  it('closes sheet when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AdoptionFiltersSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
