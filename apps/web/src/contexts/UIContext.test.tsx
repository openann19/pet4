import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UIProvider, useUIContext } from './UIContext';
import type { AbsoluteMaxUIModeConfig } from '@/agi_ui_engine/config/ABSOLUTE_MAX_UI_MODE';

function TestComponent(): React.JSX.Element {
  const { config } = useUIContext();
  return (
    <div data-testid="config-test">
      {config.visual.enableBlur ? 'blur-enabled' : 'blur-disabled'}
    </div>
  );
}

describe('UIProvider', () => {
  it('should provide default config when no config prop is provided', () => {
    render(
      <UIProvider>
        <TestComponent />
      </UIProvider>
    );

    expect(screen.getByTestId('config-test')).toHaveTextContent('blur-enabled');
  });

  it('should provide merged config when partial config is provided', () => {
    render(
      <UIProvider
        config={{
          visual: {
            enableBlur: false,
            enableGlow: true,
            enableShadows: true,
            enableShimmer: true,
            enable3DTilt: true,
            backdropSaturation: 1.5,
            maxElevation: 24,
            borderRadius: '2xl',
            highContrastText: true,
          },
        }}
      >
        <TestComponent />
      </UIProvider>
    );

    expect(screen.getByTestId('config-test')).toHaveTextContent('blur-disabled');
  });

  it('should deep merge nested config objects', () => {
    const TestComponent2 = (): React.JSX.Element => {
      const { config } = useUIContext();
      return (
        <div data-testid="merged-config">
          {config.visual.enableBlur ? 'blur-enabled' : 'blur-disabled'}
          {config.visual.enableGlow ? 'glow-enabled' : 'glow-disabled'}
          {config.animation.springPhysics.damping}
        </div>
      );
    };

    render(
      <UIProvider
        config={
          {
            visual: {
              enableBlur: false,
              enableGlow: true,
              enableShadows: true,
              enableShimmer: true,
              enable3DTilt: true,
              backdropSaturation: 1.5,
              maxElevation: 24,
              borderRadius: '2xl',
              highContrastText: true,
            },
            animation: {
              enableReanimated: true,
              smoothEntry: true,
              tapFeedback: 'spring' as const,
              motionBlur: true,
              springPhysics: {
                damping: 20,
                stiffness: 250,
                mass: 0.9,
              },
              showParticles: true,
              showTrails: true,
              motionFPS: 60,
            },
          } as Partial<AbsoluteMaxUIModeConfig>
        }
      >
        <TestComponent2 />
      </UIProvider>
    );

    const element = screen.getByTestId('merged-config');
    expect(element).toHaveTextContent('blur-disabled');
    expect(element).toHaveTextContent('glow-enabled');
    expect(element).toHaveTextContent('20');
  });

  it('should throw error when useUIContext is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useUIContext must be used within a UIProvider');

    consoleError.mockRestore();
  });
});
