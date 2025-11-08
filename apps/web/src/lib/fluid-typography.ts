export const fluidTypography = {
  display: {
    base: 'text-3xl sm:text-4xl lg:text-5xl',
    weight: 'font-bold',
    lineHeight: 'leading-tight',
    tracking: 'tracking-tight',
  },
  h1: {
    base: 'text-2xl sm:text-3xl lg:text-4xl',
    weight: 'font-bold',
    lineHeight: 'leading-tight',
    tracking: 'tracking-tight',
  },
  h2: {
    base: 'text-xl sm:text-2xl lg:text-3xl',
    weight: 'font-semibold',
    lineHeight: 'leading-snug',
    tracking: 'tracking-tight',
  },
  h3: {
    base: 'text-lg sm:text-xl lg:text-2xl',
    weight: 'font-semibold',
    lineHeight: 'leading-snug',
    tracking: 'tracking-normal',
  },
  h4: {
    base: 'text-base sm:text-lg lg:text-xl',
    weight: 'font-semibold',
    lineHeight: 'leading-normal',
    tracking: 'tracking-normal',
  },
  body: {
    base: 'text-sm sm:text-base',
    weight: 'font-normal',
    lineHeight: 'leading-relaxed',
    tracking: 'tracking-normal',
  },
  bodyLarge: {
    base: 'text-base sm:text-lg',
    weight: 'font-normal',
    lineHeight: 'leading-relaxed',
    tracking: 'tracking-normal',
  },
  small: {
    base: 'text-xs sm:text-sm',
    weight: 'font-normal',
    lineHeight: 'leading-normal',
    tracking: 'tracking-normal',
  },
  caption: {
    base: 'text-xs',
    weight: 'font-normal',
    lineHeight: 'leading-normal',
    tracking: 'tracking-wide',
  },
  button: {
    base: 'text-sm sm:text-base',
    weight: 'font-semibold',
    lineHeight: 'leading-none',
    tracking: 'tracking-normal',
  },
  buttonSmall: {
    base: 'text-xs sm:text-sm',
    weight: 'font-semibold',
    lineHeight: 'leading-none',
    tracking: 'tracking-normal',
  },
} as const;

export type FluidTypographyVariant = keyof typeof fluidTypography;

export function getFluidTypographyClasses(variant: FluidTypographyVariant): string {
  const style = fluidTypography[variant];
  return `${style.base} ${style.weight} ${style.lineHeight} ${style.tracking}`;
}

export const lineClampUtilities = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
  none: 'line-clamp-none',
} as const;

export type LineClamp = keyof typeof lineClampUtilities;

export function getLineClampClass(lines: LineClamp): string {
  return lineClampUtilities[lines];
}

export const buttonSizeUtilities = {
  xs: {
    padding: 'px-2 py-1',
    minWidth: 'min-w-[60px]',
    maxWidth: 'max-w-[120px]',
    height: 'h-7',
    typography: 'text-xs',
  },
  sm: {
    padding: 'px-3 py-1.5',
    minWidth: 'min-w-[80px]',
    maxWidth: 'max-w-[160px]',
    height: 'h-8',
    typography: 'text-sm',
  },
  md: {
    padding: 'px-4 py-2',
    minWidth: 'min-w-[100px]',
    maxWidth: 'max-w-[200px]',
    height: 'h-10',
    typography: 'text-base',
  },
  lg: {
    padding: 'px-6 py-2.5',
    minWidth: 'min-w-[120px]',
    maxWidth: 'max-w-[240px]',
    height: 'h-11',
    typography: 'text-base',
  },
  xl: {
    padding: 'px-8 py-3',
    minWidth: 'min-w-[140px]',
    maxWidth: 'max-w-[280px]',
    height: 'h-12',
    typography: 'text-lg',
  },
} as const;

export type ButtonSize = keyof typeof buttonSizeUtilities;

export function getButtonSizeClasses(size: ButtonSize): string {
  const sizeConfig = buttonSizeUtilities[size];
  return `${sizeConfig.padding} ${sizeConfig.minWidth} ${sizeConfig.maxWidth} ${sizeConfig.height} ${sizeConfig.typography}`;
}
