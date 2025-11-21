/**
 * SegmentedControl Component Tests
 * Verifies rendering, single-select and multi-select change callbacks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl, type SegmentedControlOption } from '@/components/enhanced/buttons/SegmentedControl';

vi.mock('@/hooks/use-ui-config', () => ({
    useUIConfig: () => ({ theme: 'light' }),
}));

vi.mock('@/utils/reduced-motion', () => ({
    usePrefersReducedMotion: () => false,
}));

describe('SegmentedControl', () => {
    const options: SegmentedControlOption[] = [
        { label: 'One', value: 'one' },
        { label: 'Two', value: 'two' },
        { label: 'Three', value: 'three' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders options as tabs with correct aria attributes', () => {
        render(
            <SegmentedControl
                options={options}
                value="one"
                aria-label="View filter"
            />,
        );

        const tablist = screen.getByRole('tablist', { name: /view filter/i });
        expect(tablist).toBeInTheDocument();

        const tabOne = screen.getByRole('tab', { name: 'One' });
        const tabTwo = screen.getByRole('tab', { name: 'Two' });

        expect(tabOne).toHaveAttribute('aria-selected', 'true');
        expect(tabTwo).toHaveAttribute('aria-selected', 'false');
    });

    it('calls onChange with new value in single-select mode', async () => {
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });

        const handleChange = vi.fn();

        render(
            <SegmentedControl
                options={options}
                value="one"
                onChange={handleChange}
                aria-label="Sort"
            />,
        );

        const tabTwo = screen.getByRole('tab', { name: 'Two' });
        await user.click(tabTwo);

        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith('two');
    });

    it('calls onChange with updated list in multi-select mode', async () => {
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });

        const handleChange = vi.fn();

        render(
            <SegmentedControl
                options={options}
                value={["one"]}
                multiSelect
                onChange={handleChange}
                aria-label="Multi Select"
            />,
        );

        const tabTwo = screen.getByRole('tab', { name: 'Two' });
        await user.click(tabTwo);

        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith(['one', 'two']);
    });
});
