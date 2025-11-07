/**
 * Button Color Tokens
 * 
 * Defines button colors per theme (dark/light) and locale (EN/BG)
 * All colors are verified to meet WCAG AA contrast requirements (3:1 minimum for UI)
 * No opacity/blend hacks - solid colors only
 */

export type Theme = 'dark' | 'light'
export type Locale = 'en' | 'bg'

export interface ButtonColorTokens {
  /** Primary button - default CTA */
  primary: {
    background: string
    foreground: string
    hover: {
      background: string
      foreground: string
    }
    pressed: {
      background: string
      foreground: string
    }
    disabled: {
      background: string
      foreground: string
    }
    focusRing: string
  }

  /** Secondary button */
  secondary: {
    background: string
    foreground: string
    hover: {
      background: string
      foreground: string
    }
    pressed: {
      background: string
      foreground: string
    }
    disabled: {
      background: string
      foreground: string
    }
    focusRing: string
  }

  /** Destructive button - delete/danger actions */
  destructive: {
    background: string
    foreground: string
    hover: {
      background: string
      foreground: string
    }
    pressed: {
      background: string
      foreground: string
    }
    disabled: {
      background: string
      foreground: string
    }
    focusRing: string
  }

  /** Outline button */
  outline: {
    border: string
    background: string
    foreground: string
    hover: {
      border: string
      background: string
      foreground: string
    }
    pressed: {
      border: string
      background: string
      foreground: string
    }
    disabled: {
      border: string
      background: string
      foreground: string
    }
    focusRing: string
  }

  /** Ghost button */
  ghost: {
    background: string
    foreground: string
    hover: {
      background: string
      foreground: string
    }
    pressed: {
      background: string
      foreground: string
    }
    disabled: {
      background: string
      foreground: string
    }
    focusRing: string
  }

  /** Link button */
  link: {
    foreground: string
    hover: {
      foreground: string
    }
    disabled: {
      foreground: string
    }
    focusRing: string
  }
}

export type ButtonTokenSet = Record<Theme, Record<Locale, ButtonColorTokens>>

/**
 * Minimum hit area size (44x44px) for touch targets
 */
export const MIN_TOUCH_TARGET_SIZE = 44
