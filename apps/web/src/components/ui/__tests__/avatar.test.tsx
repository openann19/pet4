/**
 * Avatar Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from '../avatar';

describe('Avatar', () => {
  it('should render avatar', () => {
    render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByAltText('User')).toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('should render fallback when image fails', () => {
    render(
      <Avatar>
        <AvatarImage src="invalid-url" alt="User" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('should have data-slot attributes', () => {
    render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    );

    const avatar = screen.getByAltText('User').closest('[data-slot="avatar"]');
    expect(avatar).toBeInTheDocument();
  });
});

