import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RouteErrorBoundary } from '../RouteErrorBoundary';
import { createLogger } from '@/lib/logger';

vi.mock('@/lib/logger', () => ({
    createLogger: vi.fn(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    })),
}));

const TestErrorComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }): JSX.Element => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>Test Component</div>;
};

const ChunkErrorComponent = (): JSX.Element => {
    throw new Error('Loading chunk failed');
};

const HydrationErrorComponent = (): JSX.Element => {
    throw new Error('Hydration failed');
};

describe('RouteErrorBoundary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders children when there is no error', () => {
        render(
            <BrowserRouter>
                <RouteErrorBoundary>
                    <TestErrorComponent />
                </RouteErrorBoundary>
            </BrowserRouter>
        );

        expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('catches and displays route errors', async () => {
        const onError = vi.fn();

        // Suppress console.error for expected error boundary errors
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            // Suppress expected error boundary errors
        });

        render(
            <BrowserRouter>
                <RouteErrorBoundary onError={onError}>
                    <TestErrorComponent shouldThrow />
                </RouteErrorBoundary>
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Navigation Error')).toBeInTheDocument();
        });

        expect(onError).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('displays chunk load error message', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            // Suppress expected error boundary errors
        });

        render(
            <BrowserRouter>
                <RouteErrorBoundary>
                    <ChunkErrorComponent />
                </RouteErrorBoundary>
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Failed to load application code/)).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    it('displays hydration error message', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            // Suppress expected error boundary errors
        });

        render(
            <BrowserRouter>
                <RouteErrorBoundary>
                    <HydrationErrorComponent />
                </RouteErrorBoundary>
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Content mismatch detected/)).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    it('resets error when retry is clicked', async () => {
        const user = userEvent.setup();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            // Suppress expected error boundary errors
        });

        const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }): JSX.Element => {
            if (shouldThrow) {
                throw new Error('Test error');
            }
            return <div>Test Component</div>;
        };

        const { rerender } = render(
            <BrowserRouter>
                <RouteErrorBoundary>
                    <ThrowingComponent shouldThrow={true} />
                </RouteErrorBoundary>
            </BrowserRouter>
        );

        await waitFor(
            () => {
                expect(screen.getByText('Navigation Error')).toBeInTheDocument();
            },
            { timeout: 2000 }
        );

        const retryButton = screen.getByRole('button', { name: /try again/i });
        await user.click(retryButton);

        rerender(
            <BrowserRouter>
                <RouteErrorBoundary>
                    <ThrowingComponent shouldThrow={false} />
                </RouteErrorBoundary>
            </BrowserRouter>
        );

        await waitFor(
            () => {
                expect(screen.getByText('Test Component')).toBeInTheDocument();
            },
            { timeout: 2000 }
        );

        consoleSpy.mockRestore();
    });

    it('displays go home button', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            // Suppress expected error boundary errors
        });

        render(
            <BrowserRouter>
                <RouteErrorBoundary>
                    <TestErrorComponent shouldThrow />
                </RouteErrorBoundary>
            </BrowserRouter>
        );

        await waitFor(
            () => {
                expect(screen.getByText('Navigation Error')).toBeInTheDocument();
            },
            { timeout: 2000 }
        );

        const homeButton = screen.getByRole('button', { name: /go home/i });
        expect(homeButton).toBeInTheDocument();

        consoleSpy.mockRestore();
    });
});
