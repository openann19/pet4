/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { NotificationTabs } from './NotificationTabs';

function setup(opts?: Partial<React.ComponentProps<typeof NotificationTabs>>) {
  const onTabChange = vi.fn();
  const ui = render(
    <NotificationTabs
      locale="en"
      unread={{ all: 13, matches: 12, messages: 1 }}
      onTabChange={onTabChange}
      storageKey="test-notif:lastTab"
      renderPanel={(k) => <div>panel-{k}</div>}
      {...opts}
    />
  );
  return { ...ui, onTabChange };
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (q) =>
      ({
        matches: q.includes('prefers-reduced-motion') ? false : false,
        media: q,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList
  );
});

describe('NotificationTabs', () => {
  it('renders default tab and panels', () => {
    setup();
    expect(screen.getByRole('tab', { name: /All/i })).toHaveAttribute('aria-selected', 'true');
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toBeInTheDocument();
    expect(tabpanel).toHaveAttribute('aria-labelledby');
  });

  it('unread badge caps at 9+ and is localized', () => {
    setup();
    const matches = screen.getByRole('tab', { name: /Matches/ });
    expect(matches).toBeInTheDocument();
    const badge = matches.querySelector('[title="12"]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('9+');
  });

  it('keyboard navigation and activation', async () => {
    const user = userEvent.setup();
    const { onTabChange } = setup();
    const all = screen.getByRole('tab', { name: /All/ });
    all.focus();
    await user.keyboard('{ArrowRight}'); // focus -> Matches
    await user.keyboard('{Enter}'); // activate Matches
    expect(onTabChange).toHaveBeenCalledWith('all', 'matches');
    expect(screen.getByRole('tab', { name: /Matches/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('persists last tab to localStorage and restores', async () => {
    const user = userEvent.setup();
    const { unmount } = setup();
    await user.click(screen.getByRole('tab', { name: /Messages/ }));
    expect(localStorage.getItem('test-notif:lastTab')).toContain('messages');
    // re-render
    unmount();
    const onTabChange = vi.fn();
    render(
      <NotificationTabs
        locale="en"
        onTabChange={onTabChange}
        storageKey="test-notif:lastTab"
        renderPanel={(k) => <div>panel-{k}</div>}
      />
    );
    expect(screen.getByRole('tab', { name: /Messages/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('a11y roles and attributes are present', () => {
    setup();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    const allTab = screen.getByRole('tab', { name: /All/i });
    expect(allTab).toHaveAttribute('aria-controls');
    expect(allTab.id).toMatch(/tab-/);
    const matchesTab = screen.getByRole('tab', { name: /Matches/i });
    expect(matchesTab).toHaveAttribute('aria-controls');
    expect(matchesTab.id).toMatch(/tab-/);
    const messagesTab = screen.getByRole('tab', { name: /Messages/i });
    expect(messagesTab).toHaveAttribute('aria-controls');
    expect(messagesTab.id).toMatch(/tab-/);
  });
});
