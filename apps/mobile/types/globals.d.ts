/**
 * Global type declarations for React Native with optional DOM APIs
 * TODO: Temporary triage - These are platform-specific and should be properly typed
 */

declare global {
  // DOM APIs that may be available in React Native Web or polyfilled environments
  const window: Window & typeof globalThis | undefined
  const document: Document | undefined
  const navigator: Navigator | undefined
}

// MediaQueryList types (web-only, but may be polyfilled)
interface MediaQueryList extends EventTarget {
  readonly matches: boolean
  readonly media: string
  addEventListener(
    type: 'change',
    listener: (event: MediaQueryListEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener(
    type: 'change',
    listener: (event: MediaQueryListEvent) => void,
    options?: boolean | EventListenerOptions
  ): void
  // Legacy methods (deprecated but still used in some browsers)
  addListener(listener: (event: MediaQueryListEvent) => void): void
  removeListener(listener: (event: MediaQueryListEvent) => void): void
  onchange: ((event: MediaQueryListEvent) => void) | null
}

interface MediaQueryListEvent extends Event {
  readonly matches: boolean
  readonly media: string
}

interface Window {
  matchMedia?(query: string): MediaQueryList
}

interface Navigator {
  vibrate?(pattern: number | number[]): boolean
}

export {}

