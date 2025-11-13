export const typographyScale = {
  display: {
    fontSize: 'text-[clamp(2.25rem,3vw,3rem)]',
    lineHeight: 'leading-[1.2]',
    fontWeight: 'font-[700]',
    letterSpacing: 'tracking-tight',
    maxLines: 'line-clamp-2',
  },
  h1: {
    fontSize: 'text-[clamp(1.75rem,2.5vw,2.25rem)]',
    lineHeight: 'leading-[1.3]',
    fontWeight: 'font-[600]',
    letterSpacing: 'tracking-tight',
    maxLines: 'line-clamp-2',
  },
  h2: {
    fontSize: 'text-[clamp(1.5rem,2.1vw,2rem)]',
    lineHeight: 'leading-[1.35]',
    fontWeight: 'font-semibold',
    letterSpacing: 'tracking-normal',
    maxLines: 'line-clamp-2',
  },
  h3: {
    fontSize: 'text-[1.25rem] sm:text-[1.5rem]',
    lineHeight: 'leading-[1.4]',
    fontWeight: 'font-medium',
    letterSpacing: 'tracking-normal',
    maxLines: 'line-clamp-2',
  },
  body: {
    fontSize: 'text-base',
    lineHeight: 'leading-[1.5]',
    fontWeight: 'font-normal',
    letterSpacing: 'tracking-normal',
    maxLines: 'line-clamp-none',
  },
  'body-sm': {
    fontSize: 'text-[0.875rem]',
    lineHeight: 'leading-[1.4]',
    fontWeight: 'font-normal',
    letterSpacing: 'tracking-normal',
    maxLines: 'line-clamp-none',
  },
  caption: {
    fontSize: 'text-[0.75rem]',
    lineHeight: 'leading-[1.4]',
    fontWeight: 'font-normal',
    letterSpacing: 'tracking-normal',
    maxLines: 'line-clamp-none',
  },
  button: {
    fontSize: 'text-sm sm:text-base',
    lineHeight: 'leading-[1.4]',
    fontWeight: 'font-medium',
    letterSpacing: 'tracking-normal',
    maxLines: 'line-clamp-2',
  },
} as const;

export const spacingScale = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
} as const;

export const spacingTailwindClasses = {
  xs: {
    gap: 'gap-1',
    padding: 'p-1',
    paddingX: 'px-1',
    paddingY: 'py-1',
    margin: 'm-1',
    marginX: 'mx-1',
    marginY: 'my-1',
    spaceY: 'space-y-1',
    spaceX: 'space-x-1',
  },
  sm: {
    gap: 'gap-2',
    padding: 'p-2',
    paddingX: 'px-2',
    paddingY: 'py-2',
    margin: 'm-2',
    marginX: 'mx-2',
    marginY: 'my-2',
    spaceY: 'space-y-2',
    spaceX: 'space-x-2',
  },
  md: {
    gap: 'gap-3',
    padding: 'p-3',
    paddingX: 'px-3',
    paddingY: 'py-3',
    margin: 'm-3',
    marginX: 'mx-3',
    marginY: 'my-3',
    spaceY: 'space-y-3',
    spaceX: 'space-x-3',
  },
  lg: {
    gap: 'gap-4',
    padding: 'p-4',
    paddingX: 'px-4',
    paddingY: 'py-4',
    margin: 'm-4',
    marginX: 'mx-4',
    marginY: 'my-4',
    spaceY: 'space-y-4',
    spaceX: 'space-x-4',
  },
  xl: {
    gap: 'gap-6',
    padding: 'p-6',
    paddingX: 'px-6',
    paddingY: 'py-6',
    margin: 'm-6',
    marginX: 'mx-6',
    marginY: 'my-6',
    spaceY: 'space-y-6',
    spaceX: 'space-x-6',
  },
  '2xl': {
    gap: 'gap-8',
    padding: 'p-8',
    paddingX: 'px-8',
    paddingY: 'py-8',
    margin: 'm-8',
    marginX: 'mx-8',
    marginY: 'my-8',
    spaceY: 'space-y-8',
    spaceX: 'space-x-8',
  },
} as const;

export const minTouchTarget = '44px';

export function getTypographyClasses(variant: keyof typeof typographyScale) {
  const config = typographyScale[variant];
  if (!config) {
    return '';
  }
  return `${config.fontSize} ${config.lineHeight} ${config.fontWeight} ${config.letterSpacing} ${config.maxLines} break-words`;
}

export type SpacingSize = keyof typeof spacingScale;
export type SpacingType = 'gap' | 'padding' | 'paddingX' | 'paddingY' | 'margin' | 'marginX' | 'marginY' | 'spaceY' | 'spaceX';

export function getSpacingClass(size: SpacingSize, type: SpacingType): string {
  return spacingTailwindClasses[size][type];
}

export function getSpacingClasses(
  size: SpacingSize,
  types: SpacingType[]
): string {
  return types.map((type) => getSpacingClass(size, type)).join(' ');
}

export interface SpacingConfig {
  gap?: SpacingSize;
  padding?: SpacingSize;
  paddingX?: SpacingSize;
  paddingY?: SpacingSize;
  margin?: SpacingSize;
  marginX?: SpacingSize;
  marginY?: SpacingSize;
  spaceY?: SpacingSize;
  spaceX?: SpacingSize;
}

export function getSpacingClassesFromConfig(config: SpacingConfig): string {
  const classes: string[] = [];
  
  if (config.gap) classes.push(getSpacingClass(config.gap, 'gap'));
  if (config.padding) classes.push(getSpacingClass(config.padding, 'padding'));
  if (config.paddingX) classes.push(getSpacingClass(config.paddingX, 'paddingX'));
  if (config.paddingY) classes.push(getSpacingClass(config.paddingY, 'paddingY'));
  if (config.margin) classes.push(getSpacingClass(config.margin, 'margin'));
  if (config.marginX) classes.push(getSpacingClass(config.marginX, 'marginX'));
  if (config.marginY) classes.push(getSpacingClass(config.marginY, 'marginY'));
  if (config.spaceY) classes.push(getSpacingClass(config.spaceY, 'spaceY'));
  if (config.spaceX) classes.push(getSpacingClass(config.spaceX, 'spaceX'));
  
  return classes.join(' ');
}

export const accessibilityClasses = {
  focusVisible:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  srOnly: 'sr-only',
  notSrOnly: 'not-sr-only',
  minTouch: 'min-h-[44px] min-w-[44px]',
};
