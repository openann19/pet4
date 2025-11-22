/**
 * SavedSearchesManager Tests
 * Verifies empty state, saving a new search, and applying an existing search.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DiscoveryPreferences } from '@/components/discovery-preferences';
import { DEFAULT_PREFERENCES } from '@/components/discovery-preferences';
import type { SavedSearch } from '@/lib/saved-search-types';
import SavedSearchesManager from '@/components/discovery/SavedSearchesManager';

// In-memory storage state for saved-searches key
let savedSearchesState: SavedSearch[] = [];

const setSavedSearchesMock = vi.fn(
    async (updater: SavedSearch[] | ((prev: SavedSearch[] | null) => SavedSearch[])) => {
        const current = savedSearchesState ?? [];
        savedSearchesState =
            typeof updater === 'function'
                ? (updater as (prev: SavedSearch[] | null) => SavedSearch[])(current)
                : updater ?? [];
    },
);

const deleteSavedSearchesMock = vi.fn(async () => {
    savedSearchesState = [];
});

vi.mock('@/hooks/use-storage', () => ({
    useStorage: <T,>(key: string, defaultValue: T) => {
        if (key === 'saved-searches') {
            return [
                savedSearchesState as T,
                setSavedSearchesMock as unknown as (value: T | ((prev: T) => T)) => Promise<void>,
                deleteSavedSearchesMock as unknown as () => Promise<void>,
            ];
        }
        return [
            defaultValue,
            vi.fn(async () => { }),
            vi.fn(async () => { }),
        ] as [T, (value: T | ((prev: T) => T)) => Promise<void>, () => Promise<void>];
    },
}));

vi.mock('@petspark/motion', () => {
    const MotionView = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;

    const motion = {
        // Minimal implementations so motion.button / motion.div work in tests
        button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
            <button type={props.type ?? 'button'} {...props}>
                {children}
            </button>
        ),
        div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
            <div {...props}>{children}</div>
        ),
    };

    return {
        MotionView,
        motion,
    };
});

vi.mock('@/effects/reanimated/use-modal-animation', () => ({
    useModalAnimation: () => ({ style: {} }),
}));

vi.mock('@/effects/reanimated/use-expand-collapse', () => ({
    useExpandCollapse: () => ({ heightStyle: {} }),
}));

vi.mock('@/effects/reanimated/use-staggered-item', () => ({
    useStaggeredItem: () => ({ animatedStyle: {} }),
}));

vi.mock('@/effects/reanimated/use-bounce-on-tap', () => ({
    useBounceOnTap: () => ({ animatedStyle: {}, handlePress: vi.fn() }),
}));

vi.mock('@/effects/reanimated/use-hover-lift', () => ({
    useHoverLift: () => ({ animatedStyle: {}, handleEnter: vi.fn(), handleLeave: vi.fn() }),
}));

vi.mock('@/effects/reanimated/animated-view', () => ({
    AnimatedView: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

vi.mock('@/lib/haptics', () => ({
    triggerHaptic: vi.fn(),
    haptics: {
        impact: vi.fn(),
        trigger: vi.fn(),
        light: vi.fn(),
        medium: vi.fn(),
        heavy: vi.fn(),
        selection: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        notification: vi.fn(),
        isHapticSupported: vi.fn(() => false),
    },
}));

describe('SavedSearchesManager', () => {
    const basePrefs: DiscoveryPreferences = DEFAULT_PREFERENCES;

    const renderManager = (prefs: DiscoveryPreferences = basePrefs) => {
        const onApplySearch = vi.fn<(p: DiscoveryPreferences) => void>();
        const onClose = vi.fn<() => void>();

        const result = render(
            <SavedSearchesManager
                currentPreferences={prefs}
                onApplySearch={onApplySearch}
                onClose={onClose}
            />,
        );

        return { ...result, onApplySearch, onClose };
    };

    beforeEach(() => {
        savedSearchesState = [];
        setSavedSearchesMock.mockClear();
        deleteSavedSearchesMock.mockClear();
    });

    it('renders empty state when there are no saved searches', () => {
        renderManager();

        expect(screen.getByText('Saved Searches')).toBeInTheDocument();
        const emptyMessages = screen.getAllByText('No saved searches yet');
        expect(emptyMessages.length).toBeGreaterThanOrEqual(1);
        expect(
            screen.getByText('Save your current filters to quickly access them later'),
        ).toBeInTheDocument();
    });

    it('saves current search with given name', async () => {
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });

        const { onApplySearch } = renderManager();
        expect(onApplySearch).not.toHaveBeenCalled();

        const saveCurrentButton = screen.getByRole('button', { name: /save current/i });
        await user.click(saveCurrentButton);

        const nameInput = await screen.findByPlaceholderText(/e.g., active dogs under 5/i);
        await user.type(nameInput, 'My Search');

        const saveButton = screen.getByRole('button', { name: /^Save$/i });
        await user.click(saveButton);

        await waitFor(() => {
            expect(setSavedSearchesMock).toHaveBeenCalledTimes(1);
        });

        const updater = setSavedSearchesMock.mock.calls[0][0] as (prev: SavedSearch[] | null) => SavedSearch[];
        const result = updater([]);

        expect(result).toHaveLength(1);
        const created = result[0];
        expect(created.name).toBe('My Search');
        expect(created.preferences).toEqual(basePrefs);
        expect(created.isPinned).toBe(false);
        expect(created.useCount).toBe(0);

        const { toast } = await import('sonner');
        const { triggerHaptic } = await import('@/lib/haptics');
        expect(toast.success).toHaveBeenCalled();
        expect(triggerHaptic).toHaveBeenCalledWith('success');
    });

    it('applies an existing saved search and closes the manager', async () => {
        vi.useRealTimers();
        const user = userEvent.setup({ delay: null });

        const savedSearch: SavedSearch = {
            id: 'search-1',
            name: 'Pinned search',
            icon: '⭐',
            preferences: {
                ...basePrefs,
                maxDistance: 25,
            },
            isPinned: true,
            useCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        savedSearchesState = [savedSearch];

        const { onApplySearch, onClose } = renderManager();

        const applyButton = screen.getByRole('button', { name: /apply/i });
        await user.click(applyButton);

        await waitFor(() => {
            expect(setSavedSearchesMock).toHaveBeenCalledTimes(1);
        });

        expect(onApplySearch).toHaveBeenCalledTimes(1);
        expect(onApplySearch).toHaveBeenCalledWith(savedSearch.preferences);
        expect(onClose).toHaveBeenCalledTimes(1);

        const { toast } = await import('sonner');
        const { triggerHaptic } = await import('@/lib/haptics');
        expect(toast.success).toHaveBeenCalled();
        expect(triggerHaptic).toHaveBeenCalledWith('selection');
    });
});
