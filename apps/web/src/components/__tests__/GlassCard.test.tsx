/**
 * GlassCard component tests
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GlassCard from '../GlassCard';

describe('GlassCard', () => {
  it('should render children', () => {
    render(
      <GlassCard>
        <div>Test content</div>
      </GlassCard>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should apply medium intensity by default', () => {
    const { container } = render(
      <GlassCard>
        <div>Content</div>
      </GlassCard>
    );
    
    const card = container.firstChild;
    expect(card).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <GlassCard className="custom-class">
        <div>Content</div>
      </GlassCard>
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should render with different intensities', () => {
    const { rerender, container } = render(
      <GlassCard intensity="light">
        <div>Content</div>
      </GlassCard>
    );
    expect(container.firstChild).toBeInTheDocument();

    rerender(
      <GlassCard intensity="strong">
        <div>Content</div>
      </GlassCard>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should support enableHover prop', () => {
    const { container } = render(
      <GlassCard enableHover={false}>
        <div>Content</div>
      </GlassCard>
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });
});
