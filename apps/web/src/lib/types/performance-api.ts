/**
 * Type definitions for Performance API extensions
 * These types extend the standard Web Performance API with browser-specific extensions
 */

/**
 * LayoutShift entry from Performance API
 * Chrome-specific extension for Cumulative Layout Shift metric
 */
export interface LayoutShiftEntry extends PerformanceEntry {
  readonly value: number
  readonly hadRecentInput: boolean
  readonly sources: ReadonlyArray<LayoutShiftAttribution>
}

/**
 * Attribution for layout shift sources
 */
export interface LayoutShiftAttribution {
  readonly node?: Node
  readonly previousRect: DOMRectReadOnly
  readonly currentRect: DOMRectReadOnly
}

/**
 * PerformanceEventTiming entry for First Input Delay metric
 */
export interface PerformanceEventTiming extends PerformanceEntry {
  readonly processingStart: number
  readonly processingEnd: number
  readonly cancelable: boolean
  readonly target?: Node
  readonly interactionId?: number
}

/**
 * PerformanceMemory interface for Chrome-specific memory API
 */
export interface PerformanceMemory {
  readonly usedJSHeapSize: number
  readonly totalJSHeapSize: number
  readonly jsHeapSizeLimit: number
}

/**
 * Extended Performance interface with memory property
 */
export interface PerformanceWithMemory extends Performance {
  readonly memory?: PerformanceMemory
}

/**
 * Permission descriptor names for Permissions API
 * Some browsers support additional permission names beyond the standard
 */
export type ExtendedPermissionName =
  | 'camera'
  | 'microphone'
  | 'geolocation'
  | 'notifications'
  | 'persistent-storage'
  | 'accelerometer'
  | 'gyroscope'
  | 'magnetometer'

/**
 * Extended PermissionDescriptor for non-standard permission names
 */
export interface ExtendedPermissionDescriptor {
  name: ExtendedPermissionName
}

