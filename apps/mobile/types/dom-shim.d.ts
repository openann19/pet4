// Minimal DOM shims for React Native TypeScript builds.

type FrameRequestCallback = (time: number) => void

declare global {
  interface DOMRect {
    readonly bottom: number
    readonly height: number
    readonly left: number
    readonly right: number
    readonly top: number
    readonly width: number
  }

  interface MediaQueryList {
    readonly matches: boolean
    addEventListener?: (type: 'change', listener: EventListener, options?: unknown) => void
    removeEventListener?: (type: 'change', listener: EventListener, options?: unknown) => void
  }

  interface MediaQueryListEvent {
    readonly matches: boolean
  }

  type EventListener = (...args: readonly unknown[]) => void

  interface Navigator {
    vibrate?: (pattern: number | readonly number[]) => void
    readonly deviceMemory?: number
    readonly hardwareConcurrency?: number
  }

  interface Window {
    matchMedia?: (query: string) => MediaQueryList
    requestAnimationFrame?: (callback: FrameRequestCallback) => number
  }

  interface Document {
    addEventListener?: (type: string, listener: EventListener, options?: unknown) => void
    removeEventListener?: (type: string, listener: EventListener, options?: unknown) => void
  }

  interface MouseEvent {
    readonly clientX: number
    readonly clientY: number
  }

  interface Touch {
    readonly clientX: number
    readonly clientY: number
  }

  interface TouchList {
    readonly length: number
    item(index: number): Touch | null
    [index: number]: Touch
  }

  interface TouchEvent {
    readonly touches: TouchList
  }

  interface HTMLDivElement {
    getBoundingClientRect(): DOMRect
  }

  const window: Window | undefined
  const document: Document | undefined
  const navigator: Navigator | undefined
}

export {}
