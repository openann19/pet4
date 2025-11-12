/**
 * Design Token Utilities Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    getSpacing,
    getRadius,
    getShadow,
    getZIndex,
    getColor,
    getGradient,
    getMotionDuration,
    getMotionEasing,
    getBreakpoint,
    getFontSize,
    getFontWeight,
    getLineHeight,
    getLetterSpacing,
    getFontFamily,
    getHitAreaMinimum,
    injectTokenCSSVariables,
    tokens,
} from '../design-tokens';

describe('design-tokens', () => {
    beforeEach(() => {
        document.documentElement.style.cssText = '';
    });

    afterEach(() => {
        document.documentElement.style.cssText = '';
    });

    describe('getSpacing', () => {
        it('returns spacing value for valid key', () => {
            expect(getSpacing('4')).toBe('16px');
            expect(getSpacing('8')).toBe('32px');
            expect(getSpacing('0')).toBe('0');
        });

        it('returns spacing values for all keys', () => {
            expect(getSpacing('1')).toBe('4px');
            expect(getSpacing('2')).toBe('8px');
            expect(getSpacing('12')).toBe('48px');
        });
    });

    describe('getRadius', () => {
        it('returns radius value for valid key', () => {
            expect(getRadius('md')).toBe('8px');
            expect(getRadius('lg')).toBe('12px');
            expect(getRadius('full')).toBe('9999px');
        });

        it('returns radius values for all keys', () => {
            expect(getRadius('none')).toBe('0');
            expect(getRadius('xs')).toBe('4px');
            expect(getRadius('sm')).toBe('6px');
        });
    });

    describe('getShadow', () => {
        it('returns shadow value for valid key', () => {
            const shadow = getShadow('sm');
            expect(shadow).toBeTruthy();
            expect(typeof shadow).toBe('string');
        });

        it('returns glow shadow for nested keys', () => {
            const glow = getShadow('glow.primary');
            expect(glow).toBeTruthy();
            expect(typeof glow).toBe('string');
        });

        it('returns all shadow types', () => {
            expect(getShadow('xs')).toBeTruthy();
            expect(getShadow('md')).toBeTruthy();
            expect(getShadow('lg')).toBeTruthy();
            expect(getShadow('glow.accent')).toBeTruthy();
        });
    });

    describe('getZIndex', () => {
        it('returns z-index value for valid key', () => {
            expect(getZIndex('base')).toBe(0);
            expect(getZIndex('modal')).toBe(1400);
            expect(getZIndex('tooltip')).toBe(1600);
        });

        it('returns numeric z-index values', () => {
            expect(typeof getZIndex('dropdown')).toBe('number');
            expect(typeof getZIndex('overlay')).toBe('number');
        });
    });

    describe('getColor', () => {
        it('returns color value for light theme', () => {
            const color = getColor('background', 'light');
            expect(color).toBeTruthy();
            expect(color).toContain('oklch');
        });

        it('returns color value for dark theme', () => {
            const color = getColor('background', 'dark');
            expect(color).toBeTruthy();
            expect(color).toContain('oklch');
        });

        it('returns different colors for light and dark themes', () => {
            const lightColor = getColor('background', 'light');
            const darkColor = getColor('background', 'dark');
            expect(lightColor).not.toBe(darkColor);
        });

        it('defaults to light theme', () => {
            const color = getColor('primary');
            expect(color).toBeTruthy();
        });
    });

    describe('getGradient', () => {
        it('returns gradient value for primary', () => {
            const gradient = getGradient('primary');
            expect(gradient).toBeTruthy();
            expect(gradient).toContain('linear-gradient');
        });

        it('returns radial gradient for nested keys', () => {
            const gradient = getGradient('radial.primary');
            expect(gradient).toBeTruthy();
            expect(gradient).toContain('radial-gradient');
        });

        it('returns ambient gradient for nested keys', () => {
            const gradient = getGradient('ambient.warm');
            expect(gradient).toBeTruthy();
            expect(gradient).toContain('linear-gradient');
        });
    });

    describe('getMotionDuration', () => {
        it('returns duration value for valid key', () => {
            expect(getMotionDuration('fast')).toBe('150ms');
            expect(getMotionDuration('normal')).toBe('200ms');
            expect(getMotionDuration('slow')).toBe('400ms');
        });

        it('returns all duration values', () => {
            expect(getMotionDuration('instant')).toBe('50ms');
            expect(getMotionDuration('smooth')).toBe('300ms');
            expect(getMotionDuration('slower')).toBe('600ms');
        });
    });

    describe('getMotionEasing', () => {
        it('returns easing value for valid key', () => {
            expect(getMotionEasing('linear')).toBe('linear');
            expect(getMotionEasing('ease')).toBe('ease');
        });

        it('returns cubic-bezier for advanced easings', () => {
            const easing = getMotionEasing('easeInOut');
            expect(easing).toContain('cubic-bezier');
        });
    });

    describe('getBreakpoint', () => {
        it('returns breakpoint value for valid key', () => {
            expect(getBreakpoint('sm')).toBe('640px');
            expect(getBreakpoint('md')).toBe('768px');
            expect(getBreakpoint('lg')).toBe('1024px');
        });

        it('returns all breakpoint values', () => {
            expect(getBreakpoint('xl')).toBe('1280px');
            expect(getBreakpoint('2xl')).toBe('1536px');
        });
    });

    describe('getFontSize', () => {
        it('returns font size value for valid key', () => {
            expect(getFontSize('base')).toBe('16px');
            expect(getFontSize('lg')).toBe('18px');
            expect(getFontSize('xl')).toBe('20px');
        });

        it('returns all font size values', () => {
            expect(getFontSize('xs')).toBe('12px');
            expect(getFontSize('sm')).toBe('14px');
            expect(getFontSize('2xl')).toBe('24px');
        });
    });

    describe('getFontWeight', () => {
        it('returns font weight value for valid key', () => {
            expect(getFontWeight('normal')).toBe(400);
            expect(getFontWeight('medium')).toBe(500);
            expect(getFontWeight('bold')).toBe(700);
        });

        it('returns numeric font weight values', () => {
            expect(typeof getFontWeight('semibold')).toBe('number');
            expect(getFontWeight('semibold')).toBe(600);
        });
    });

    describe('getLineHeight', () => {
        it('returns line height value for valid key', () => {
            expect(getLineHeight('normal')).toBe(1.5);
            expect(getLineHeight('tight')).toBe(1.25);
            expect(getLineHeight('loose')).toBe(2);
        });

        it('returns numeric line height values', () => {
            expect(typeof getLineHeight('snug')).toBe('number');
            expect(typeof getLineHeight('relaxed')).toBe('number');
        });
    });

    describe('getLetterSpacing', () => {
        it('returns letter spacing value for valid key', () => {
            expect(getLetterSpacing('normal')).toBe('0');
            expect(getLetterSpacing('tight')).toBe('-0.025em');
            expect(getLetterSpacing('wide')).toBe('0.025em');
        });

        it('returns all letter spacing values', () => {
            expect(getLetterSpacing('tighter')).toBe('-0.05em');
            expect(getLetterSpacing('wider')).toBe('0.05em');
            expect(getLetterSpacing('widest')).toBe('0.1em');
        });
    });

    describe('getFontFamily', () => {
        it('returns font family for display', () => {
            const font = getFontFamily('display');
            expect(font).toBeTruthy();
            expect(font).toContain('Inter');
        });

        it('returns font family for body', () => {
            const font = getFontFamily('body');
            expect(font).toBeTruthy();
            expect(font).toContain('Inter');
        });

        it('returns font family for mono', () => {
            const font = getFontFamily('mono');
            expect(font).toBeTruthy();
            expect(font).toContain('Monaco');
        });
    });

    describe('getHitAreaMinimum', () => {
        it('returns hit area minimum value', () => {
            expect(getHitAreaMinimum()).toBe('44px');
        });
    });

    describe('injectTokenCSSVariables', () => {
        it('injects color CSS variables for light theme', () => {
            injectTokenCSSVariables('light');
            const background = document.documentElement.style.getPropertyValue('--color-background');
            expect(background).toBeTruthy();
            expect(background).toContain('oklch');
        });

        it('injects color CSS variables for dark theme', () => {
            injectTokenCSSVariables('dark');
            const background = document.documentElement.style.getPropertyValue('--color-background');
            expect(background).toBeTruthy();
            expect(background).toContain('oklch');
        });

        it('injects spacing CSS variables', () => {
            injectTokenCSSVariables('light');
            const spacing = document.documentElement.style.getPropertyValue('--spacing-4');
            expect(spacing).toBe('16px');
        });

        it('injects radius CSS variables', () => {
            injectTokenCSSVariables('light');
            const radius = document.documentElement.style.getPropertyValue('--radius-md');
            expect(radius).toBe('8px');
        });

        it('injects shadow CSS variables', () => {
            injectTokenCSSVariables('light');
            const shadow = document.documentElement.style.getPropertyValue('--shadow-sm');
            expect(shadow).toBeTruthy();
        });

        it('injects glow shadow CSS variables', () => {
            injectTokenCSSVariables('light');
            const glow = document.documentElement.style.getPropertyValue('--shadow-glow-primary');
            expect(glow).toBeTruthy();
        });

        it('injects z-index CSS variables', () => {
            injectTokenCSSVariables('light');
            const zIndex = document.documentElement.style.getPropertyValue('--z-index-modal');
            expect(zIndex).toBe('1400');
        });

        it('injects typography CSS variables', () => {
            injectTokenCSSVariables('light');
            const fontSize = document.documentElement.style.getPropertyValue('--font-size-base');
            expect(fontSize).toBe('16px');

            const fontWeight = document.documentElement.style.getPropertyValue('--font-weight-bold');
            expect(fontWeight).toBe('700');

            const fontFamily = document.documentElement.style.getPropertyValue('--font-family-display');
            expect(fontFamily).toBeTruthy();
        });

        it('injects gradient CSS variables', () => {
            injectTokenCSSVariables('light');
            const gradient = document.documentElement.style.getPropertyValue('--gradient-primary');
            expect(gradient).toBeTruthy();
            expect(gradient).toContain('linear-gradient');
        });

        it('injects motion CSS variables', () => {
            injectTokenCSSVariables('light');
            const duration = document.documentElement.style.getPropertyValue('--motion-duration-fast');
            expect(duration).toBe('150ms');

            const easing = document.documentElement.style.getPropertyValue('--motion-easing-ease-in-out');
            expect(easing).toBeTruthy();
            expect(easing).toContain('cubic-bezier');
        });

        it('injects breakpoint CSS variables', () => {
            injectTokenCSSVariables('light');
            const breakpoint = document.documentElement.style.getPropertyValue('--breakpoint-md');
            expect(breakpoint).toBe('768px');
        });

        it('injects hit area CSS variable', () => {
            injectTokenCSSVariables('light');
            const hitArea = document.documentElement.style.getPropertyValue('--hit-area-minimum');
            expect(hitArea).toBe('44px');
        });

        it('handles window undefined gracefully', () => {
            const originalWindow = global.window;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const globalAny = global as any;
            const originalWindowProp = globalAny.window;
            delete globalAny.window;

            expect(() => injectTokenCSSVariables('light')).not.toThrow();

            globalAny.window = originalWindowProp;
        });
    });

    describe('tokens export', () => {
        it('exports tokens object', () => {
            expect(tokens).toBeDefined();
            expect(tokens.spacing).toBeDefined();
            expect(tokens.colors).toBeDefined();
            expect(tokens.typography).toBeDefined();
        });

        it('has valid token structure', () => {
            expect(tokens.version).toBe('1.0.0');
            expect(tokens.colors.light).toBeDefined();
            expect(tokens.colors.dark).toBeDefined();
        });
    });
});
