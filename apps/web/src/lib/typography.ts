export const typographyScale = {
  title: {
    fontSize: 'text-2xl sm:text-3xl',
    lineHeight: 'leading-[1.3]',
    fontWeight: 'font-bold',
    letterSpacing: 'tracking-normal',
    maxLines: 'line-clamp-2',
  },
  subtitle: {
    fontSize: 'text-lg sm:text-xl',
    lineHeight: 'leading-[1.35]',
    fontWeight: 'font-semibold',
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
  caption: {
    fontSize: 'text-sm',
    lineHeight: 'leading-[1.45]',
    fontWeight: 'font-normal',
    letterSpacing: 'tracking-normal',
    maxLines: 'line-clamp-none',
  },
  badge: {
    fontSize: 'text-xs sm:text-sm',
    lineHeight: 'leading-[1.4]',
    fontWeight: 'font-medium',
    letterSpacing: 'tracking-normal',
    maxLines: 'line-clamp-2',
  },
  button: {
    fontSize: 'text-sm sm:text-base',
    lineHeight: 'leading-[1.4]',
    fontWeight: 'font-semibold',
    letterSpacing: 'tracking-normal',
    maxLines: 'line-clamp-2',
  },
} as const

export const spacingScale = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
} as const

export const minTouchTarget = '44px'

export function getTypographyClasses(variant: keyof typeof typographyScale) {
  const config = typographyScale[variant]
  return `${String(config.fontSize ?? '')} ${String(config.lineHeight ?? '')} ${String(config.fontWeight ?? '')} ${String(config.letterSpacing ?? '')} ${String(config.maxLines ?? '')} break-words`
}

export const accessibilityClasses = {
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  srOnly: 'sr-only',
  notSrOnly: 'not-sr-only',
  minTouch: 'min-h-[44px] min-w-[44px]',
}
