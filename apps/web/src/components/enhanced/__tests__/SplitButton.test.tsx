/**
 * SplitButton Component Tests
 * Verifies main and secondary actions wiring, disabled state, and basic rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SplitButton, type SplitButtonAction } from '@/components/enhanced/buttons/SplitButton';

vi.mock('@/hooks/use-ui-config', () => ({
    useUIConfig: () => ({ theme: 'light' }),
}));

vi.mock('@/effects/reanimated/use-hover-lift', () => ({
    useHoverLift: () => ({
        scale: 1,
        translateY: 0,
        handleEnter: vi.fn(),
        handleLeave: vi.fn(),
        variants: {},
    }),
}));

// Stub PremiumButton to a simple button so we only test SplitButton wiring
vi.mock('../PremiumButton', () => ({
    PremiumButton: ({
        children,
        // Strip non-DOM props like `loading` to avoid React warnings
        loading: _loading,
        ...props
    }: { children: React.ReactNode; loading?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button type="button" {...props}>
            {children}
        </button>
    ),
}));

// Stub dropdown menu primitives so secondary actions render as simple buttons
vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({
        children,
        onClick,
        disabled,
    }: {
        children: React.ReactNode;
        onClick?: () => void;
        disabled?: boolean;
    }) => (
        <button type="button" onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
}));

describe('SplitButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders main and secondary actions', () => {
        const mainAction = { label: 'Save', onClick: vi.fn() };
        const secondaryActions: SplitButtonAction[] = [
            { label: 'Save as draft', onClick: vi.fn() },
        ];

        render(
            <SplitButton
                mainAction={mainAction}
                secondaryActions={secondaryActions}
                variant="primary"
            />,
        );

        // Use an exact match so we target the primary Save button only
        expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save as draft/i })).toBeInTheDocument();
    });

    it('calls mainAction.onClick when primary button is clicked', async () => {
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });

        const mainAction = { label: 'Save', onClick: vi.fn() };
        const secondaryActions: SplitButtonAction[] = [];

        render(
            <SplitButton
                mainAction={mainAction}
                secondaryActions={secondaryActions}
            />,
        );

        const mainButton = screen.getByRole('button', { name: /^Save$/i });
        await user.click(mainButton);

        expect(mainAction.onClick).toHaveBeenCalledTimes(1);
    });

    it('calls secondary action when menu item is clicked', async () => {
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });

        const mainAction = { label: 'Run', onClick: vi.fn() };
        const secondaryActionClick = vi.fn();
        const secondaryActions: SplitButtonAction[] = [
            { label: 'Run with options', onClick: secondaryActionClick },
        ];

        render(
            <SplitButton
                mainAction={mainAction}
                secondaryActions={secondaryActions}
            />,
        );

        const secondaryButton = screen.getByRole('button', { name: /run with options/i });
        await user.click(secondaryButton);

        expect(secondaryActionClick).toHaveBeenCalledTimes(1);
    });

    it('does not invoke mainAction when disabled', async () => {
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });

        const mainAction = { label: 'Submit', onClick: vi.fn() };
        const secondaryActions: SplitButtonAction[] = [];

        render(
            <SplitButton
                mainAction={mainAction}
                secondaryActions={secondaryActions}
                disabled
            />,
        );

        const mainButton = screen.getByRole('button', { name: /^Submit$/i });
        await user.click(mainButton);

        expect(mainAction.onClick).not.toHaveBeenCalled();
    });
});
