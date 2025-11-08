/// <reference types="vite/client" />

/**
 * Vite Compatibility Layer
 * 
 * Extends ImportMetaHot.on to accept both legacy (Vite 5.x) and v6 shapes.
 * This prevents type errors when plugins drag in older Vite type definitions.
 * Safe: only loosens the callback signature without affecting runtime.
 */
declare global {
  interface ImportMetaHot {
    on(event: string, cb: (...args: unknown[]) => void): void;
  }
}

export {};
