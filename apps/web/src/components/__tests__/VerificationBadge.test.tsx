/**
 * VerificationBadge component tests
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VerificationBadge } from '../VerificationBadge';

describe('VerificationBadge', () => {
  it('should not render when not verified', () => {
    const { container } = render(<VerificationBadge verified={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render basic verification badge', () => {
    render(<VerificationBadge verified={true} level="basic" />);
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('should render standard verification badge', () => {
    render(<VerificationBadge verified={true} level="standard" />);
    expect(screen.getByText('⭐')).toBeInTheDocument();
    expect(screen.getByText('Standard Verified')).toBeInTheDocument();
  });

  it('should render premium verification badge', () => {
    render(<VerificationBadge verified={true} level="premium" />);
    expect(screen.getByText('👑')).toBeInTheDocument();
    expect(screen.getByText('Premium Verified')).toBeInTheDocument();
  });

  it('should render without tooltip when showTooltip is false', () => {
    render(<VerificationBadge verified={true} showTooltip={false} />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('should apply size classes correctly', () => {
    const { container: containerSm } = render(
      <VerificationBadge verified={true} size="sm" showTooltip={false} />
    );
    expect(containerSm.querySelector('.text-xs')).toBeInTheDocument();

    const { container: containerLg } = render(
      <VerificationBadge verified={true} size="lg" showTooltip={false} />
    );
    expect(containerLg.querySelector('.text-base')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <VerificationBadge verified={true} className="custom-class" showTooltip={false} />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
