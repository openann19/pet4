/**
 * ErrorBoundary Edge Case Tests
 *
 * Tests error boundary behavior, recovery, and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../ErrorBoundary';
import { createLogger } from '@/lib/logger';

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}));

// Component that throws an error
const ThrowError = ({ message = 'Test error' }: { message?: string }) => {
  throw new Error(message);
};

// Component that throws in useEffect
const ThrowErrorInEffect = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Error in render');
  }
  return <div>No error</div>;
};

// Component that throws non-Error object
const ThrowNonError = () => {
  throw 'String error';
};

describe('ErrorBoundary', () => {
  const mockLogger = createLogger('ErrorBoundary');

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for expected error throws
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Catching', () => {
    it('should catch errors in child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should catch errors thrown in render', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorInEffect />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('should handle non-Error objects thrown', () => {
      render(
        <ErrorBoundary>
          <ThrowNonError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('should display error message in dev mode', () => {
      const originalEnv = import.meta.env.DEV;
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: true },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError message="Dev error message" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error details')).toBeInTheDocument();

      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: originalEnv },
        writable: true,
      });
    });
  });

  describe('Error Recovery', () => {
    it('should reset error state when Try Again is clicked', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      // Re-render with non-throwing component
      rerender(
        <ErrorBoundary>
          <div>Recovered content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Recovered content')).toBeInTheDocument();
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
    });

    it('should call onReset callback when reset', async () => {
      const user = userEvent.setup();
      const onReset = vi.fn();

      render(
        <ErrorBoundary onReset={onReset}>
          <ThrowError />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      expect(onReset).toHaveBeenCalled();
    });

    it('should reload page when Refresh Page is clicked', async () => {
      const user = userEvent.setup();
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh page/i });
      await user.click(refreshButton);

      expect(reloadSpy).toHaveBeenCalled();

      reloadSpy.mockRestore();
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
    });

    it('should still call onError with custom fallback', () => {
      const onError = vi.fn();
      const customFallback = <div>Custom fallback</div>;

      render(
        <ErrorBoundary fallback={customFallback} onError={onError}>
          <ThrowError message="Custom error" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe('Error Handler', () => {
    it('should call onError callback when error occurs', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError message="Handler test" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Handler test',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should not call onError if error is recovered', async () => {
      const user = userEvent.setup();
      const onError = vi.fn();

      const { rerender } = render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      rerender(
        <ErrorBoundary onError={onError}>
          <div>No error</div>
        </ErrorBoundary>
      );

      // onError should not be called again on recovery
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple errors sequentially', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError message="First error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      // Trigger another error
      rerender(
        <ErrorBoundary>
          <ThrowError message="Second error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      // Should not throw, just render nothing
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(
        <ErrorBoundary>
          <></>
        </ErrorBoundary>
      );

      // Should not throw
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
    });

    it('should handle error in nested component', () => {
      const NestedComponent = () => (
        <div>
          <ThrowError />
        </div>
      );

      render(
        <ErrorBoundary>
          <NestedComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('should preserve error state during re-renders', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // Re-render with same error
      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Error state should persist
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should handle component that throws during loading', () => {
      const LoadingComponent = () => {
        throw new Error('Loading error');
      };

      render(
        <ErrorBoundary>
          <LoadingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });
  });
});
