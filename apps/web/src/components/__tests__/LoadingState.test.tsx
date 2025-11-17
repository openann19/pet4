/**
 * LoadingState component tests
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoadingState from '../LoadingState';

describe('LoadingState', () => {
  it('should render loading state', () => {
    render(<LoadingState />);
    
    expect(screen.getByText(/loading your experience/i)).toBeInTheDocument();
  });

  it('should display loading text', () => {
    render(<LoadingState />);
    
    expect(screen.getByText(/preparing amazing connections/i)).toBeInTheDocument();
  });

  it('should have proper structure', () => {
    const { container } = render(<LoadingState />);
    
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('flex', 'min-h-[60vh]');
  });
});
