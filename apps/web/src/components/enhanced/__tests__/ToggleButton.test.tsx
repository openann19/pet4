/**
 * ToggleButton Component Tests
 * Ensures toggle behavior, callbacks, ARIA attributes, and basic styling wiring.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleButton } from '@/components/enhanced/buttons/ToggleButton';

// Provide a minimal UI config to avoid depending on real context wiring
vi.mock('@/hooks/use-ui-config', () => ({
    useUIConfig: () => ({ theme: 'light' }),
}));

// Stub haptics to avoid real side effects
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

describe('ToggleButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with aria-label and default unchecked state', () => {
        render(<ToggleButton aria-label="Notifications" />);

        const button = screen.getByRole('button', { name: /notifications/i });
        expect(button).toBeInTheDocument();
        // getAriaButtonAttributes should wire pressed state
        expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('calls onChange and onClick when toggled', async () => {
        // userEvent requires real timers in this repo's test setup
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });
        const handleChange = vi.fn();
        const handleClick = vi.fn();

        render(
            <ToggleButton
                aria-label="Toggle notifications"
                checked={false}
                onChange={handleChange}
                onClick={handleClick}
            />,
        );

        const button = screen.getByRole('button', { name: /toggle notifications/i });
        await user.click(button);

        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith(true);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not fire callbacks when disabled', async () => {
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });
        const handleChange = vi.fn();
        const handleClick = vi.fn();

        render(
            <ToggleButton
                aria-label="Disabled toggle"
                checked={false}
                onChange={handleChange}
                onClick={handleClick}
                disabled
            />,
        );

        const button = screen.getByRole('button', { name: /disabled toggle/i });
        await user.click(button);

        expect(handleChange).not.toHaveBeenCalled();
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies variant and size classes while remaining accessible', () => {
        const { rerender } = render(
            <ToggleButton aria-label="Primary" variant="primary" size="sm">
                Primary
            </ToggleButton>,
        );

        const primaryButton = screen.getByRole('button', { name: /primary/i });
        expect(primaryButton.className).toContain('rounded-xl');

        rerender(
            <ToggleButton aria-label="Ghost" variant="ghost" size="lg">
                Ghost
            </ToggleButton>,
        );

        const ghostButton = screen.getByRole('button', { name: /ghost/i });
        expect(ghostButton.className).toContain('rounded-xl');
    });
});
