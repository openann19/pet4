import { describe, it, expect } from 'vitest';
import {
  fluidTypography,
  getFluidTypographyClasses,
  lineClampUtilities,
  getLineClampClass,
  buttonSizeUtilities,
  getButtonSizeClasses,
} from './fluid-typography';

describe('fluid-typography', () => {
  describe('fluidTypography', () => {
    it('should have all expected variants', () => {
      const expectedVariants = [
        'display',
        'h1',
        'h2',
        'h3',
        'h4',
        'body',
        'bodyLarge',
        'small',
        'caption',
        'button',
        'buttonSmall',
      ];

      expectedVariants.forEach((variant) => {
        expect(fluidTypography).toHaveProperty(variant);
      });
    });

    it('should have required properties for each variant', () => {
      Object.values(fluidTypography).forEach((variant) => {
        expect(variant).toHaveProperty('base');
        expect(variant).toHaveProperty('weight');
        expect(variant).toHaveProperty('lineHeight');
        expect(variant).toHaveProperty('tracking');
      });
    });

    it('should have display variant with correct classes', () => {
      const display = fluidTypography.display;
      expect(display.base).toContain('text-');
      expect(display.weight).toBe('font-bold');
      expect(display.lineHeight).toBe('leading-tight');
      expect(display.tracking).toBe('tracking-tight');
    });
  });

  describe('getFluidTypographyClasses', () => {
    it('should return combined classes for h1', () => {
      const classes = getFluidTypographyClasses('h1');
      expect(classes).toContain('text-2xl');
      expect(classes).toContain('font-bold');
      expect(classes).toContain('leading-tight');
      expect(classes).toContain('tracking-tight');
    });

    it('should return combined classes for body', () => {
      const classes = getFluidTypographyClasses('body');
      expect(classes).toContain('text-sm');
      expect(classes).toContain('font-normal');
      expect(classes).toContain('leading-relaxed');
    });

    it('should return combined classes for button', () => {
      const classes = getFluidTypographyClasses('button');
      expect(classes).toContain('text-sm');
      expect(classes).toContain('font-semibold');
      expect(classes).toContain('leading-none');
    });
  });

  describe('lineClampUtilities', () => {
    it('should have line clamp options from 1-6 and none', () => {
      expect(lineClampUtilities).toHaveProperty('1', 'line-clamp-1');
      expect(lineClampUtilities).toHaveProperty('2', 'line-clamp-2');
      expect(lineClampUtilities).toHaveProperty('3', 'line-clamp-3');
      expect(lineClampUtilities).toHaveProperty('4', 'line-clamp-4');
      expect(lineClampUtilities).toHaveProperty('5', 'line-clamp-5');
      expect(lineClampUtilities).toHaveProperty('6', 'line-clamp-6');
      expect(lineClampUtilities).toHaveProperty('none', 'line-clamp-none');
    });
  });

  describe('getLineClampClass', () => {
    it('should return correct class for line clamp 1', () => {
      expect(getLineClampClass(1)).toBe('line-clamp-1');
    });

    it('should return correct class for line clamp 3', () => {
      expect(getLineClampClass(3)).toBe('line-clamp-3');
    });

    it('should return correct class for line clamp none', () => {
      expect(getLineClampClass('none')).toBe('line-clamp-none');
    });
  });

  describe('buttonSizeUtilities', () => {
    it('should have all size options', () => {
      const expectedSizes = ['xs', 'sm', 'md', 'lg', 'xl'];

      expectedSizes.forEach((size) => {
        expect(buttonSizeUtilities).toHaveProperty(size);
      });
    });

    it('should have required properties for each size', () => {
      Object.values(buttonSizeUtilities).forEach((sizeConfig) => {
        expect(sizeConfig).toHaveProperty('padding');
        expect(sizeConfig).toHaveProperty('minWidth');
        expect(sizeConfig).toHaveProperty('maxWidth');
        expect(sizeConfig).toHaveProperty('height');
        expect(sizeConfig).toHaveProperty('typography');
      });
    });

    it('should have increasing sizes', () => {
      const xs = buttonSizeUtilities.xs;
      const sm = buttonSizeUtilities.sm;
      const md = buttonSizeUtilities.md;
      const lg = buttonSizeUtilities.lg;
      const xl = buttonSizeUtilities.xl;

      expect(xs.height).toBe('h-7');
      expect(sm.height).toBe('h-8');
      expect(md.height).toBe('h-10');
      expect(lg.height).toBe('h-11');
      expect(xl.height).toBe('h-12');
    });
  });

  describe('getButtonSizeClasses', () => {
    it('should return combined classes for small button', () => {
      const classes = getButtonSizeClasses('sm');
      expect(classes).toContain('px-3');
      expect(classes).toContain('py-1.5');
      expect(classes).toContain('min-w-[80px]');
      expect(classes).toContain('max-w-[160px]');
      expect(classes).toContain('h-8');
      expect(classes).toContain('text-sm');
    });

    it('should return combined classes for medium button', () => {
      const classes = getButtonSizeClasses('md');
      expect(classes).toContain('px-4');
      expect(classes).toContain('py-2');
      expect(classes).toContain('min-w-[100px]');
      expect(classes).toContain('max-w-[200px]');
      expect(classes).toContain('h-10');
    });

    it('should return combined classes for large button', () => {
      const classes = getButtonSizeClasses('lg');
      expect(classes).toContain('px-6');
      expect(classes).toContain('h-11');
      expect(classes).toContain('text-base');
    });

    it('should return combined classes for extra large button', () => {
      const classes = getButtonSizeClasses('xl');
      expect(classes).toContain('px-8');
      expect(classes).toContain('h-12');
      expect(classes).toContain('text-lg');
    });
  });
});
