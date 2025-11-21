import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavButton } from '../NavButton';

// Mock animation hooks to avoid exercising motion/reanimated internals in these unit tests
const handleHoverMock = vi.fn();
const handleLeaveMock = vi.fn();

vi.mock('@/hooks/use-nav-button-animation', () => ({
    useNavButtonAnimation: vi.fn(() => ({
        buttonStyle: {},
        iconStyle: {},
        indicatorStyle: {},
        handleHover: handleHoverMock,
        handleLeave: handleLeaveMock,
    })),
}));

const handlePressMock = vi.fn();

vi.mock('@/effects/reanimated/use-bounce-on-tap', () => ({
    useBounceOnTap: vi.fn(() => ({
        animatedStyle: {},
        handlePress: handlePressMock,
    })),
}));

describe('NavButton', () => {
    beforeEach(() => {
        handleHoverMock.mockClear();
        handleLeaveMock.mockClear();
        handlePressMock.mockClear();
    });

    it('renders label and icon with button role', () => {
        const onClick = vi.fn();

        render(
            <NavButton
                isActive={false}
                onClick={onClick}
                icon={<span data-testid="icon">★</span>}
                label="Home"
            />
        );

        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('renders active indicator only when active', () => {
        const onClick = vi.fn();

        const { rerender } = render(
            <NavButton
                isActive={false}
                onClick={onClick}
                icon={<span>★</span>}
                label="Home"
            />
        );

        let button = screen.getByRole('button');
        // Indicator element should not be present when inactive
        expect(button.querySelector('.w-8.h-1')).toBeNull();

        rerender(
            <NavButton
                isActive
                onClick={onClick}
                icon={<span>★</span>}
                label="Home"
            />
        );

        button = screen.getByRole('button');
        // Indicator element should be present when active
        expect(button.querySelector('.w-8.h-1')).not.toBeNull();
    });

    it('delegates click interactions to bounce animation handler', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();

        render(
            <NavButton
                isActive={false}
                onClick={onClick}
                icon={<span>★</span>}
                label="Home"
            />
        );

        const button = screen.getByRole('button');
        await user.click(button);

        // Component should call the bounce animation handler
        expect(handlePressMock).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard activation with Enter and Space', () => {
        const onClick = vi.fn();

        render(
            <NavButton
                isActive={false}
                onClick={onClick}
                icon={<span>★</span>}
                label="Home"
            />
        );

        const button = screen.getByRole('button');

        // Activate with Enter
        fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
        // Activate with Space
        fireEvent.keyDown(button, { key: ' ', code: 'Space' });

        expect(handlePressMock).toHaveBeenCalledTimes(2);
    });

    it('invokes hover handlers on mouse enter/leave', () => {
        const onClick = vi.fn();

        render(
            <NavButton
                isActive={false}
                onClick={onClick}
                icon={<span>★</span>}
                label="Home"
            />
        );

        const button = screen.getByRole('button');

        fireEvent.mouseEnter(button);
        fireEvent.mouseLeave(button);

        expect(handleHoverMock).toHaveBeenCalledTimes(1);
        expect(handleLeaveMock).toHaveBeenCalledTimes(1);
    });
});
