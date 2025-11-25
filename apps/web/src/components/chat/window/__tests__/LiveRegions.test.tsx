import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    AnnounceNewMessage,
    AnnounceTyping,
    SkipToComposer,
    LiveRegions,
} from '../LiveRegions';
import { UIProvider } from '@/contexts/UIContext';

const renderWithUI = (ui: React.ReactElement) => {
    const utils = render(<UIProvider>{ui}</UIProvider>);
    return {
        ...utils,
        rerender: (next: React.ReactElement) => utils.rerender(<UIProvider>{next}</UIProvider>),
    };
};

describe('AnnounceNewMessage', () => {
    it('announces last message with sender name when provided', () => {
        renderWithUI(<AnnounceNewMessage lastText="Hello" senderName="Alice" />);

        const region = screen.getByRole('status', {
            name: /new message announcement/i,
        });

        expect(region).toHaveTextContent('Alice: Hello');
    });

    it('clears announcement when there is no last message', () => {
        const { rerender } = renderWithUI(<AnnounceNewMessage lastText="Hi" senderName="Bob" />);

        rerender(<AnnounceNewMessage lastText={null} senderName={null} />);

        const region = screen.getByRole('status', {
            name: /new message announcement/i,
        });

        expect(region).toHaveTextContent('');
    });
});

describe('AnnounceTyping', () => {
    it('announces single user typing', () => {
        renderWithUI(<AnnounceTyping userName="Charlie" />);

        const region = screen.getByRole('status', {
            name: /typing indicator announcement/i,
        });

        expect(region).toHaveTextContent('Charlie is typing');
    });

    it('announces multiple users typing', () => {
        renderWithUI(<AnnounceTyping userName="ignored" multipleUsers />);

        const region = screen.getByRole('status', {
            name: /typing indicator announcement/i,
        });

        expect(region).toHaveTextContent('Multiple people are typing');
    });
});

describe('SkipToComposer', () => {
    it('focuses the input when link is clicked', async () => {
        const user = userEvent.setup();
        const input = document.createElement('input');
        const focusSpy = vi.spyOn(input, 'focus');
        const ref = { current: input } as React.RefObject<HTMLInputElement>;

        renderWithUI(<SkipToComposer inputRef={ref} />);

        const link = screen.getByRole('link', { name: /skip to message input/i });
        await user.click(link);

        expect(focusSpy).toHaveBeenCalled();
    });

    it('focuses the input when activated with keyboard', async () => {
        const user = userEvent.setup();
        const input = document.createElement('input');
        const focusSpy = vi.spyOn(input, 'focus');
        const ref = { current: input } as React.RefObject<HTMLInputElement>;

        renderWithUI(<SkipToComposer inputRef={ref} />);

        const link = screen.getByRole('link', { name: /skip to message input/i });

        // Focus the link then activate with Enter and Space
        await user.tab();
        expect(link).toHaveFocus();

        await user.keyboard('{Enter}');
        await user.keyboard(' ');

        expect(focusSpy).toHaveBeenCalledTimes(2);
    });
});

describe('LiveRegions', () => {
    it('renders children inside a live regions container', () => {
        renderWithUI(
            <LiveRegions>
                <button type="button">Child control</button>
            </LiveRegions>
        );

        const region = screen.getByRole('region', { name: /chat live regions/i });
        expect(region).toBeInTheDocument();
        expect(region).toContainElement(screen.getByText('Child control'));
    });
});
