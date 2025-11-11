/**
 * Alert Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '../alert';

describe('Alert', () => {
  it('should render alert', () => {
    render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>Alert Description</AlertDescription>
      </Alert>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert Description')).toBeInTheDocument();
  });

  it('should render with default variant', () => {
    render(<Alert>Default Alert</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render with destructive variant', () => {
    render(<Alert variant="destructive">Destructive Alert</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.className).toContain('destructive');
  });

  it('should have data-slot attribute', () => {
    render(<Alert>Test</Alert>);
    expect(screen.getByRole('alert')).toHaveAttribute('data-slot', 'alert');
  });
});

