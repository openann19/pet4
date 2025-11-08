import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../select';

// Mock Radix UI Select
vi.mock('@radix-ui/react-select', async () => {
  const actual = await vi.importActual('@radix-ui/react-select');
  return {
    ...actual,
    Root: ({ children, onValueChange, value, ...props }: any) => {
      return (
        <div data-testid="select-root" {...props}>
          {children}
        </div>
      );
    },
    Trigger: ({ children, ...props }: any) => (
      <button data-testid="select-trigger" {...props}>
        {children}
      </button>
    ),
    Value: ({ placeholder, ...props }: any) => (
      <span data-testid="select-value" {...props}>
        {placeholder}
      </span>
    ),
    Content: ({ children, ...props }: any) => (
      <div data-testid="select-content" {...props}>
        {children}
      </div>
    ),
    Item: ({ children, value, ...props }: any) => (
      <div data-testid={`select-item-${value}`} {...props}>
        {children}
      </div>
    ),
  };
});

describe('Select', () => {
  it('should render select', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId('select-root')).toBeInTheDocument();
    expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
  });

  it('should display placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
      </Select>
    );

    const trigger = screen.getByTestId('trigger');
    expect(trigger).toHaveAttribute('data-slot', 'select-trigger');
  });
});
