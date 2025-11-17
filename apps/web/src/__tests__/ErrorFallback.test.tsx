/**
 * ErrorFallback component tests
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ErrorFallback } from '../ErrorFallback';

describe('ErrorFallback', () => {
  const mockError = new Error('Test error message');
  const mockResetErrorBoundary = vi.fn();
  
  // Mock import.meta.env.DEV
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(import.meta.env, 'DEV', {
      writable: true,
      value: false,
    });
  });

  it('should render error message', () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);
    
    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });

  it('should display error details', () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);
    
    expect(screen.getByText('Error Details:')).toBeInTheDocument();
  });

  it('should show Try Again button for regular errors', () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);
    
    const tryAgainButton = screen.getByText('Try Again');
    expect(tryAgainButton).toBeInTheDocument();
  });

  it('should call resetErrorBoundary when Try Again is clicked', () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);
    
    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);
    
    expect(mockResetErrorBoundary).toHaveBeenCalled();
  });

  it('should show Hard Reload button for chunk errors', () => {
    const chunkError = new Error('Failed loading chunk');
    render(<ErrorFallback error={chunkError} resetErrorBoundary={mockResetErrorBoundary} />);
    
    const hardReloadButton = screen.getByText('Hard Reload Page');
    expect(hardReloadButton).toBeInTheDocument();
  });

  it('should detect ChunkLoadError', () => {
    const chunkError = new Error('Loading chunk failed');
    render(<ErrorFallback error={chunkError} resetErrorBoundary={mockResetErrorBoundary} />);
    
    expect(screen.getByText('Hard Reload Page')).toBeInTheDocument();
  });

  it('should show Go Home button', () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);
    
    const goHomeButton = screen.getByText('Go Home');
    expect(goHomeButton).toBeInTheDocument();
  });

  it('should display current path', () => {
    const originalPathname = window.location.pathname;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/test-path' },
    });

    render(<ErrorFallback error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);
    
    expect(screen.getByText(/Location: \/test-path/)).toBeInTheDocument();

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: originalPathname },
    });
  });

  it('should throw error in development mode', () => {
    Object.defineProperty(import.meta.env, 'DEV', {
      writable: true,
      value: true,
    });

    expect(() => {
      render(<ErrorFallback error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);
    }).toThrow('Test error message');
  });
});
