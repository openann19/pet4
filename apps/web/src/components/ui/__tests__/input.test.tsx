import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  it('should render input', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('data-slot', 'input');
  });

  it('should apply custom className', () => {
    render(<Input className="custom-input" data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-input');
  });

  it('should handle value changes', async () => {
    const user = userEvent.setup();
    render(<Input />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'test value');
    expect(input.value).toBe('test value');
  });

  it('should support different input types', () => {
    render(<Input type="email" data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input.type).toBe('email');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toBeDisabled();
  });

  it('should support placeholder', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('should support aria-invalid', () => {
    render(<Input aria-invalid="true" data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should support readOnly', () => {
    render(<Input readOnly data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('readOnly');
  });
});
